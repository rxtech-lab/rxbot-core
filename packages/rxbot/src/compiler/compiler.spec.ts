import * as path from "path";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { glob } from "glob";
//@ts-ignore
import MemoryFS from "memory-fs";
import { Compiler } from "./compiler";

jest.mock("glob");

describe("Compiler", () => {
  let fs: MemoryFS;
  let compiler: Compiler;
  const sourceDir = "/src";
  const destDir = "/dist";

  beforeEach(() => {
    fs = new MemoryFS();

    // Set up initial directory structure
    fs.mkdirpSync(sourceDir);
    fs.mkdirpSync(destDir);
    fs.mkdirpSync(path.join(sourceDir, "app"));
    fs.mkdirpSync(path.join(sourceDir, "app", "home"));
    fs.mkdirpSync(path.join(destDir, "app"));
    fs.mkdirpSync(path.join(destDir, "app", "home"));

    compiler = new Compiler({
      rootDir: sourceDir,
      destinationDir: destDir,
      fs: fs as any,
    });

    // Set up test files in memory
    fs.writeFileSync(
      `${sourceDir}/app/home/page.tsx`,
      `
        export default function HomePage() {
          return <div>Home</div>;
        }
      `,
    );
  });

  describe("Route Generation", () => {
    it("should generate correct route structure for simple page", async () => {
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return ["/app/home/page.tsx"];
      });

      const result = await compiler.compile();

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0]).toMatchObject({
        route: "/",
        page: expect.stringContaining("/dist/app/page.js"),
        "404": expect.stringContaining("/dist/app/404.js"),
        error: expect.stringContaining("/dist/app/error.js"),
        subRoutes: [
          {
            route: "/home",
            page: expect.stringContaining("/dist/app/home/page.js"),
          },
        ],
      });
    });

    it("should handle nested routes correctly", async () => {
      fs.mkdirpSync(`${sourceDir}/app/home/nested`);
      fs.writeFileSync(
        `${sourceDir}/app/home/nested/page.tsx`,
        `
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
      );
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return ["/app/home/page.tsx", "/app/home/nested/page.tsx"];
      });

      const result = await compiler.compile();

      expect(result.routes[0].subRoutes![0].subRoutes).toHaveLength(1);
      expect(result.routes[0].subRoutes![0].subRoutes![0]).toMatchObject({
        route: "/home/nested",
        page: expect.stringContaining("/dist/app/home/nested/page.js"),
      });
    });

    it("should generate client component correctly", async () => {
      fs.mkdirpSync(`${sourceDir}/app/home/nested`);
      fs.writeFileSync(
        `${sourceDir}/app/home/nested/page.tsx`,
        `"use client";
            
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
      );
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return ["/app/home/page.tsx", "/app/home/nested/page.tsx"];
      });

      const result = await compiler.compile();

      expect(result.routes[0].subRoutes![0].subRoutes).toHaveLength(1);
      expect(result.routes[0].subRoutes![0].subRoutes![0]).toMatchObject({
        route: "/home/nested",
        page: expect.stringContaining("/dist/app/home/nested/page.js"),
      });
    });

    it("should be able to extract metadata", async () => {
      fs.mkdirpSync(`${sourceDir}/app/home/nested`);
      fs.writeFileSync(
        `${sourceDir}/app/home/page.tsx`,
        `
         export const metadata = {
              title: "Nested Page",
              description: "This is a nested page"
         }
            
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
      );
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return ["/app/home/page.tsx"];
      });

      const result = await compiler.compile();
      expect(result).toStrictEqual({
        routes: [
          {
            route: "/",
            page: "/dist/app/page.js",
            "404": "/dist/app/404.js",
            error: "/dist/app/error.js",
            layouts: ["/dist/app/layout.js"],
            metadata: undefined,
            subRoutes: [
              {
                route: "/home",
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                layouts: ["/dist/app/layout.js"],
                page: "/dist/app/home/page.js",
                subRoutes: [],
                metadata: {
                  title: "Nested Page",
                  description: "This is a nested page",
                },
              },
            ],
          },
        ],
      });
    });

    it("should compile empty folder", async () => {
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return [];
      });

      const result = await compiler.compile();
      expect(result).toStrictEqual({
        routes: [
          {
            route: "/",
            page: "/dist/app/page.js",
            "404": "/dist/app/404.js",
            error: "/dist/app/error.js",
            layouts: ["/dist/app/layout.js"],
            metadata: undefined,
            subRoutes: [],
          },
        ],
      });
    });

    it("should handle very nested routes correctly", async () => {
      fs.mkdirpSync(`${sourceDir}/app/home/sub/sub2`);
      fs.mkdirpSync(`${destDir}/app/home/sub/sub2`);
      fs.writeFileSync(
        `${sourceDir}/app/home/sub/sub2/page.tsx`,
        `
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
      );
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return ["/app/home/sub/sub2/page.tsx"];
      });

      const result = await compiler.compile();

      expect(result).toStrictEqual({
        routes: [
          {
            route: "/",
            page: "/dist/app/page.js",
            "404": "/dist/app/404.js",
            error: "/dist/app/error.js",
            layouts: ["/dist/app/layout.js"],
            metadata: undefined,
            subRoutes: [
              {
                route: "/home/sub/sub2",
                page: "/dist/app/home/sub/sub2/page.js",
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                layouts: ["/dist/app/layout.js"],
                metadata: undefined,
                subRoutes: [],
              },
            ],
          },
        ],
      });
    });

    it("should handle custom error pages", async () => {
      fs.writeFileSync(
        `${sourceDir}/app/home/error.tsx`,
        `
          export default function ErrorPage() {
            return <div>Custom Error</div>;
          }
        `,
      );
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return ["/app/home/page.tsx", "/app/home/error.tsx"];
      });

      const result = await compiler.compile();

      expect(result.routes[0].subRoutes![0]).toMatchObject({
        route: "/home",
        error: expect.stringContaining("/dist/app/home/error.js"),
      });
    });

    it("should handle custom 404 pages", async () => {
      fs.writeFileSync(
        `${sourceDir}/app/home/404.tsx`,
        `
          export default function NotFoundPage() {
            return <div>Custom 404</div>;
          }
        `,
      );
      jest.spyOn(glob, "glob").mockImplementation(async () => {
        return ["/app/home/page.tsx", "/app/home/404.tsx"];
      });

      const result = await compiler.compile();

      expect(result.routes[0].subRoutes![0]).toMatchObject({
        route: "/home",
        "404": expect.stringContaining("/dist/app/home/404.js"),
      });
    });
  });

  describe("Nested routes generation", () => {
    interface TestCase {
      title: string;
      expectedObject: Record<any, any>;
      // Key is the path of the file, and value is file content
      fileStructure: Record<string, string>;
    }

    describe("Custom Error Page", () => {
      const testCases: TestCase[] = [
        {
          title: "Should handle nested error page",
          fileStructure: {
            "app/nested/page.tsx": `
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
          },
          expectedObject: {
            routes: [
              {
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                metadata: undefined,
                page: "/dist/app/page.js",
                layouts: ["/dist/app/layout.js"],
                route: "/",
                subRoutes: [
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    layouts: ["/dist/app/layout.js"],
                    page: "/dist/app/nested/page.js",
                    route: "/nested",
                    subRoutes: [],
                  },
                ],
              },
            ],
          },
        },
        {
          title: "Should handle one with custom error page, one without",
          fileStructure: {
            "app/sub1/page.tsx": `
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
            "app/sub1/error.tsx": `
          export default function CustomErrorPage() {
            return <div>Custom Error</div>;
          }
        `,
            "app/sub2/page.tsx": `
            export default function NestedPage() {
                return <div>Nested</div>;
            }
            `,
          },
          expectedObject: {
            routes: [
              {
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                metadata: undefined,
                page: "/dist/app/page.js",
                route: "/",
                layouts: ["/dist/app/layout.js"],
                subRoutes: [
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/sub1/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub1/page.js",
                    route: "/sub1",
                    subRoutes: [],
                    layouts: ["/dist/app/layout.js"],
                  },
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub2/page.js",
                    route: "/sub2",
                    subRoutes: [],
                    layouts: ["/dist/app/layout.js"],
                  },
                ],
              },
            ],
          },
        },
        {
          title:
            "Should handle one with custom error page, one using parent error page",
          fileStructure: {
            "app/home/sub1/page.tsx": `
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
            "app/home/sub1/error.tsx": `
          export default function CustomErrorPage() {
            return <div>Custom Error</div>;
          }
        `,
            "app/home/sub2/page.tsx": `
            export default function NestedPage() {
                return <div>Nested</div>;
            }
            `,
            "app/home/page.tsx": `
            export default function HomePage() {
              return <div>Home</div>;
            }
          `,
            "app/home/error.tsx": `
            export default function CustomErrorPage() {
              return <div>Custom Error</div>;
            }
          `,
          },
          expectedObject: {
            routes: [
              {
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                page: "/dist/app/page.js",
                metadata: undefined,
                route: "/",
                layouts: ["/dist/app/layout.js"],
                subRoutes: [
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/home/error.js",
                    metadata: undefined,
                    page: "/dist/app/home/page.js",
                    route: "/home",
                    layouts: ["/dist/app/layout.js"],
                    subRoutes: [
                      {
                        "404": "/dist/app/404.js",
                        error: "/dist/app/home/sub1/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub1/page.js",
                        route: "/home/sub1",
                        layouts: ["/dist/app/layout.js"],
                        subRoutes: [],
                      },
                      {
                        "404": "/dist/app/404.js",
                        error: "/dist/app/home/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub2/page.js",
                        route: "/home/sub2",
                        layouts: ["/dist/app/layout.js"],
                        subRoutes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ];

      for (const testCase of testCases) {
        it(testCase.title, async () => {
          for (const [p, content] of Object.entries(testCase.fileStructure)) {
            const basePathWithoutFile = path.dirname(p);
            // make sure the directory exists
            fs.mkdirpSync(path.join(sourceDir, basePathWithoutFile));
            fs.writeFileSync(path.join(sourceDir, p), content);
          }
          jest.spyOn(glob, "glob").mockImplementation(async () => {
            return Object.keys(testCase.fileStructure);
          });

          const result = await compiler.compile();
          expect(result).toStrictEqual(testCase.expectedObject);
        });
      }
    });

    describe("Custom 404 Page", () => {
      const testCases: TestCase[] = [
        {
          title: "Should handle one with custom 404 page, one without",
          fileStructure: {
            "app/sub1/page.tsx": `
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
            "app/sub1/404.tsx": `
          export default function CustomPage() {
            return <div>Custom 404</div>;
          }
        `,
            "app/sub2/page.tsx": `
            export default function NestedPage() {
                return <div>Nested</div>;
            }
            `,
          },
          expectedObject: {
            routes: [
              {
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                metadata: undefined,
                page: "/dist/app/page.js",
                route: "/",
                layouts: ["/dist/app/layout.js"],
                subRoutes: [
                  {
                    "404": "/dist/app/sub1/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub1/page.js",
                    route: "/sub1",
                    subRoutes: [],
                    layouts: ["/dist/app/layout.js"],
                  },
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub2/page.js",
                    route: "/sub2",
                    subRoutes: [],
                    layouts: ["/dist/app/layout.js"],
                  },
                ],
              },
            ],
          },
        },
        {
          title:
            "Should handle one with custom 404 page, one using parent 404 page",
          fileStructure: {
            "app/home/sub1/page.tsx": `
          export default function NestedPage() {
            return <div>Nested</div>;
          }
        `,
            "app/home/sub1/404.tsx": `
          export default function CustomPage() {
            return <div>Custom 404</div>;
          }
        `,
            "app/home/sub2/page.tsx": `
            export default function NestedPage() {
                return <div>Nested</div>;
            }
            `,
            "app/home/page.tsx": `
            export default function HomePage() {
              return <div>Home</div>;
            }
          `,
            "app/home/404.tsx": `
            export default function CustomPage() {
              return <div>Custom 404</div>;
            }
          `,
          },
          expectedObject: {
            routes: [
              {
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                page: "/dist/app/page.js",
                metadata: undefined,
                route: "/",
                layouts: ["/dist/app/layout.js"],
                subRoutes: [
                  {
                    "404": "/dist/app/home/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/home/page.js",
                    route: "/home",
                    layouts: ["/dist/app/layout.js"],
                    subRoutes: [
                      {
                        "404": "/dist/app/home/sub1/404.js",
                        error: "/dist/app/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub1/page.js",
                        route: "/home/sub1",
                        subRoutes: [],
                        layouts: ["/dist/app/layout.js"],
                      },
                      {
                        "404": "/dist/app/home/404.js",
                        error: "/dist/app/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub2/page.js",
                        route: "/home/sub2",
                        subRoutes: [],
                        layouts: ["/dist/app/layout.js"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ];

      for (const testCase of testCases) {
        it(testCase.title, async () => {
          for (const [p, content] of Object.entries(testCase.fileStructure)) {
            const basePathWithoutFile = path.dirname(p);
            // make sure the directory exists
            fs.mkdirpSync(path.join(sourceDir, basePathWithoutFile));
            fs.writeFileSync(path.join(sourceDir, p), content);
          }
          jest.spyOn(glob, "glob").mockImplementation(async () => {
            return Object.keys(testCase.fileStructure);
          });

          const result = await compiler.compile();
          expect(result).toStrictEqual(testCase.expectedObject);
        });
      }
    });

    describe("Nested layouts generation", () => {
      const testCases: TestCase[] = [
        // {
        //   title: "Should handle root layout only",
        //   fileStructure: {
        //     "app/layout.tsx": `
        //     export default function RootLayout({ children }) {
        //       return <div>Root Layout {children}</div>;
        //     }
        //   `,
        //     "app/page.tsx": `
        //     export default function Page() {
        //       return <div>Page</div>;
        //     }
        //   `,
        //   },
        //   expectedObject: {
        //     routes: [
        //       {
        //         route: "/",
        //         page: "/dist/app/page.js",
        //         "404": "/dist/app/404.js",
        //         error: "/dist/app/error.js",
        //         layouts: ["/dist/app/layout.js"],
        //         subRoutes: [],
        //       },
        //     ],
        //   },
        // },
        {
          title: "Should handle nested layouts",
          fileStructure: {
            "app/layout.tsx": `
            export default function RootLayout({ children }) {
              return <div>Root Layout {children}</div>;
            }
          `,
            "app/sub1/layout.tsx": `
            export default function SubLayout({ children }) {
              return <div>Sub Layout {children}</div>;
            }
          `,
            "app/sub1/page.tsx": `
            export default function Page() {
              return <div>Sub Page</div>;
            }
          `,
          },
          expectedObject: {
            routes: [
              {
                route: "/",
                page: "/dist/app/page.js",
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                layouts: ["/dist/app/layout.js"],
                metadata: undefined,
                subRoutes: [
                  {
                    route: "/sub1",
                    page: "/dist/app/sub1/page.js",
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    layouts: [
                      "/dist/app/layout.js",
                      "/dist/app/sub1/layout.js",
                    ],
                    subRoutes: [],
                    metadata: undefined,
                  },
                ],
              },
            ],
          },
        },
        {
          title: "Should handle deeply nested layouts",
          fileStructure: {
            "app/layout.tsx": `
            export default function RootLayout({ children }) {
              return <div>Root Layout {children}</div>;
            }
          `,
            "app/sub1/layout.tsx": `
            export default function SubLayout({ children }) {
              return <div>Sub Layout {children}</div>;
            }
          `,
            "app/sub1/sub2/layout.tsx": `
            export default function SubSubLayout({ children }) {
              return <div>Sub Sub Layout {children}</div>;
            }
          `,
            "app/sub1/sub2/page.tsx": `
            export default function Page() {
              return <div>Deep Page</div>;
            }
          `,
          },
          expectedObject: {
            routes: [
              {
                route: "/",
                page: "/dist/app/page.js",
                metadata: undefined,
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                layouts: ["/dist/app/layout.js"],
                subRoutes: [
                  {
                    route: "/sub1",
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    layouts: [
                      "/dist/app/layout.js",
                      "/dist/app/sub1/layout.js",
                    ],
                    subRoutes: [
                      {
                        route: "/sub1/sub2",
                        page: "/dist/app/sub1/sub2/page.js",
                        "404": "/dist/app/404.js",
                        error: "/dist/app/error.js",
                        layouts: [
                          "/dist/app/layout.js",
                          "/dist/app/sub1/layout.js",
                          "/dist/app/sub1/sub2/layout.js",
                        ],
                        subRoutes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        {
          title: "Should handle sibling layouts",
          fileStructure: {
            "app/layout.tsx": `
            export default function RootLayout({ children }) {
              return <div>Root Layout {children}</div>;
            }
          `,
            "app/sub1/layout.tsx": `
            export default function Sub1Layout({ children }) {
              return <div>Sub1 Layout {children}</div>;
            }
          `,
            "app/sub1/page.tsx": `
            export default function Sub1Page() {
              return <div>Sub1 Page</div>;
            }
          `,
            "app/sub2/layout.tsx": `
            export default function Sub2Layout({ children }) {
              return <div>Sub2 Layout {children}</div>;
            }
          `,
            "app/sub2/page.tsx": `
            export default function Sub2Page() {
              return <div>Sub2 Page</div>;
            }
          `,
          },
          expectedObject: {
            routes: [
              {
                route: "/",
                page: "/dist/app/page.js",
                metadata: undefined,
                "404": "/dist/app/404.js",
                error: "/dist/app/error.js",
                layouts: ["/dist/app/layout.js"],
                subRoutes: [
                  {
                    route: "/sub1",
                    page: "/dist/app/sub1/page.js",
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    layouts: [
                      "/dist/app/layout.js",
                      "/dist/app/sub1/layout.js",
                    ],
                    subRoutes: [],
                  },
                  {
                    route: "/sub2",
                    page: "/dist/app/sub2/page.js",
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    layouts: [
                      "/dist/app/layout.js",
                      "/dist/app/sub2/layout.js",
                    ],
                    subRoutes: [],
                  },
                ],
              },
            ],
          },
        },
      ];

      for (const testCase of testCases) {
        it(testCase.title, async () => {
          const compiler = new Compiler({
            rootDir: "/test",
            destinationDir: "/dist",
            fs: fs as any,
          });

          // Set up initial directory structure
          fs.mkdirpSync("/test");
          fs.mkdirpSync("/dist");
          fs.mkdirpSync("/test/app");

          // Mock file reads
          for (const [filePath, content] of Object.entries(
            testCase.fileStructure,
          )) {
            const basePathWithoutFile = path.dirname(filePath);
            fs.mkdirpSync(path.join("/test", basePathWithoutFile));
            fs.mkdirpSync(path.join("/dist", basePathWithoutFile));
            fs.writeFileSync(path.join("/test", filePath), content);
          }

          jest.spyOn(glob, "glob").mockImplementation(async () => {
            return Object.keys(testCase.fileStructure);
          });

          const result = await compiler.compile();
          expect(result).toEqual(testCase.expectedObject);
        });
      }
    });
  });
});
