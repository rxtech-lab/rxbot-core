//@ts-ignore
import MemoryFS from "memory-fs";
import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { Compiler } from "./compiler";
import { glob } from "glob";

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
    fs.mkdirpSync(`${sourceDir}/app`);
    fs.mkdirpSync(`${sourceDir}/app/home`);
    fs.mkdirpSync(`${destDir}/app`);
    fs.mkdirpSync(`${destDir}/app/home`);

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
});
