import * as fs from "fs";
import { describe } from "node:test";
import * as swc from "@swc/core";
import { glob } from "glob";
import { Compiler, CompilerOptions, CompilerUtils } from "./compiler";
import { readMetadata } from "./utils";
// Mock dependencies
jest.mock("@swc/core", () => ({
  transformFile: jest.fn(),
  transform: jest.fn().mockResolvedValue({
    code: "compiled code",
    ast: {},
  }),
}));

jest.mock("./utils", () => ({
  readMetadata: jest.fn(),
  isTypeScript: jest.fn().mockReturnValue(true),
  parseSourceCode: jest.fn(),
  generateClientComponentTag: jest.fn().mockReturnValue(""),
  checkDuplicateKeys: jest.fn(),
  extractJSXKeyAttributes: jest.fn().mockReturnValue([
    {
      value: "key1",
    },
    {
      value: "key2",
    },
  ]),
}));

// Mock the glob module
jest.mock("glob", () => ({
  glob: {
    glob: jest.fn(),
  },
}));

jest.mock("fs", () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn(),
  rmSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe("buildRouteInfo", () => {
  let compiler: Compiler;
  const mockOptions: CompilerOptions = {
    rootDir: "/src",
    destinationDir: "/dist",
  };

  beforeEach(() => {
    compiler = new Compiler(mockOptions);
  });

  it("should correctly build route info for a single page", async () => {
    const result = await compiler.buildRouteInfo([
      {
        code: "",
        ast: {} as any,
        outputFilePath: "/dist/app/page.js",
        outputDir: "/dist/app",
        sourceCodePath: "/src/app/page.tsx",
      },
    ]);

    expect(result).toEqual([
      {
        page: "/dist/app/page.js",
        route: "/",
        subRoutes: [],
      },
    ]);
  });

  it("should correctly build route info for nested pages", async () => {
    const result = await compiler.buildRouteInfo([
      {
        code: "",
        ast: {} as any,
        outputFilePath: "/dist/app/page.js",
        outputDir: "/dist/app",
        sourceCodePath: "/src/app/page.tsx",
      },
      {
        code: "",
        ast: {} as any,
        outputFilePath: "/dist/app/dashboard/settings/page.js",
        outputDir: "/dist/app/nested",
        sourceCodePath: "/src/app/dashboard/settings/page.tsx",
      },
    ]);

    expect(result).toEqual([
      {
        route: "/",
        page: "/dist/app/page.js",
        subRoutes: [],
      },
      {
        route: "/dashboard",
        subRoutes: [
          {
            route: "/dashboard/settings",
            page: "/dist/app/dashboard/settings/page.js",
            subRoutes: [],
          },
        ],
      },
    ]);
  });

  it("should return an empty array when no pages are found", async () => {
    (glob.glob as jest.Mock).mockResolvedValue([]);

    const result = await compiler.buildRouteInfo([]);

    expect(result).toEqual([]);
  });
});

describe("Compiler.compile", () => {
  let compiler: Compiler;
  const mockOptions: CompilerOptions = {
    rootDir: "/path/to/project",
    destinationDir: "/path/to/output",
  };

  beforeEach(() => {
    compiler = new Compiler(mockOptions);
    jest.clearAllMocks();
  });

  it("should compile a single page without root route", async () => {
    const mockPages = ["/app/home/page.tsx"];
    (require("glob").glob.glob as jest.Mock).mockResolvedValue(mockPages);
    (swc.transformFile as jest.Mock).mockResolvedValue({
      code: "compiled code",
    });
    (readMetadata as jest.Mock).mockResolvedValue({ title: "Home" });

    const result = await compiler.compile();

    expect(result).toStrictEqual({
      routes: [
        {
          route: "/",
          page: "/path/to/output/app/page.js",
          "404": "/path/to/output/app/404.js",
          error: "/path/to/output/app/error.js",
          metadata: undefined,
          subRoutes: [
            {
              route: "/home",
              page: "/path/to/output/app/home/page.js",
              "404": "/path/to/output/app/404.js",
              error: "/path/to/output/app/error.js",
              subRoutes: [],
              metadata: { title: "Home" },
            },
          ],
        },
      ],
    });
  });

  it("should compile a single page with root route", async () => {
    const mockPages = ["/app/page.tsx"];
    (require("glob").glob.glob as jest.Mock).mockResolvedValue(mockPages);
    (swc.transformFile as jest.Mock).mockResolvedValue({
      code: "compiled code",
    });
    (readMetadata as jest.Mock).mockResolvedValue({ title: "Home" });
    (fs.existsSync as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    const result = await compiler.compile();

    expect(result).toStrictEqual({
      routes: [
        {
          route: "/",
          page: "/path/to/output/app/page.js",
          "404": "/path/to/output/app/404.js",
          error: "/path/to/output/app/error.js",
          metadata: { title: "Home" },
          subRoutes: [],
        },
      ],
    });
  });

  it("should handle compilation errors", async () => {
    const mockPages = ["/path/to/project/error/page.tsx"];
    (require("glob").glob.glob as jest.Mock).mockResolvedValue(mockPages);
    (swc.transformFile as jest.Mock).mockRejectedValue(
      new Error("Compilation error"),
    );
    (readMetadata as jest.Mock).mockResolvedValue({});

    await expect(compiler.compile()).rejects.toThrow("Compilation error");
  });

  it("should use default output directory if not specified", async () => {
    const compilerWithoutDestDir = new Compiler({
      rootDir: "/path/to/project",
    });
    const mockPages = ["/path/to/project/home/page.tsx"];
    (require("glob").glob.glob as jest.Mock).mockResolvedValue(mockPages);
    (swc.transformFile as jest.Mock).mockResolvedValue({
      code: "compiled code",
    });
    (readMetadata as jest.Mock).mockResolvedValue({});

    await compilerWithoutDestDir.compile();
  });

  it("should handle empty project with no pages", async () => {
    (require("glob").glob.glob as jest.Mock).mockResolvedValue([]);

    const result = await compiler.compile();

    expect(result).toEqual({
      routes: [
        {
          "404": "/path/to/output/app/404.js",
          error: "/path/to/output/app/error.js",
          page: "/path/to/output/app/page.js",
          route: "/",
          subRoutes: [],
        },
      ],
    });
    expect(swc.transformFile).not.toHaveBeenCalled();
    expect(readMetadata).not.toHaveBeenCalled();
  });
});

describe("Compiler.getOutputPath", () => {
  const testCases = [
    {
      input: "/path/to/project/home/page.ts",
      output: "page.js",
    },
    {
      input: "/path/to/project/page.tsx",
      output: "page.js",
    },
    {
      input: "/path/to/project/home/page.tsx",
      output: "page.js",
    },
  ];

  testCases.forEach(({ input, output }) => {
    it(`should correctly generate output path for ${input}`, () => {
      const utils = new CompilerUtils("/path/to/project", "/path/to/output");
      const result = utils.getOutputPath(input);
      expect(result.outputFileName).toContain(output);
    });
  });
});
