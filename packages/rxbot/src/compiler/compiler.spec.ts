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
                route: "/",
                subRoutes: [
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
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
                subRoutes: [
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/sub1/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub1/page.js",
                    route: "/sub1",
                    subRoutes: [],
                  },
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub2/page.js",
                    route: "/sub2",
                    subRoutes: [],
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
                subRoutes: [
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/home/error.js",
                    metadata: undefined,
                    page: "/dist/app/home/page.js",
                    route: "/home",
                    subRoutes: [
                      {
                        "404": "/dist/app/404.js",
                        error: "/dist/app/home/sub1/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub1/page.js",
                        route: "/home/sub1",
                        subRoutes: [],
                      },
                      {
                        "404": "/dist/app/404.js",
                        error: "/dist/app/home/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub2/page.js",
                        route: "/home/sub2",
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
                subRoutes: [
                  {
                    "404": "/dist/app/sub1/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub1/page.js",
                    route: "/sub1",
                    subRoutes: [],
                  },
                  {
                    "404": "/dist/app/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/sub2/page.js",
                    route: "/sub2",
                    subRoutes: [],
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
                subRoutes: [
                  {
                    "404": "/dist/app/home/404.js",
                    error: "/dist/app/error.js",
                    metadata: undefined,
                    page: "/dist/app/home/page.js",
                    route: "/home",
                    subRoutes: [
                      {
                        "404": "/dist/app/home/sub1/404.js",
                        error: "/dist/app/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub1/page.js",
                        route: "/home/sub1",
                        subRoutes: [],
                      },
                      {
                        "404": "/dist/app/home/404.js",
                        error: "/dist/app/error.js",
                        metadata: undefined,
                        page: "/dist/app/home/sub2/page.js",
                        route: "/home/sub2",
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
  });
});
