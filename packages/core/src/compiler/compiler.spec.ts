import * as path from "path";
import swc from "@swc/core";
import { glob } from "glob";
import { Compiler, CompilerOptions } from "./compiler";
import { extractJSXKeyAttributes, readMetadata } from "./utils";
// Mock dependencies
jest.mock("@swc/core", () => ({
  transformFile: jest.fn(),
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
}));

describe("buildRouteInfo", () => {
  let compiler: Compiler;
  const mockOptions: CompilerOptions = {
    rootDir: "apps",
  };

  beforeEach(() => {
    compiler = new Compiler(mockOptions);
  });

  it("should correctly build route info for a single page", async () => {
    (glob.glob as jest.Mock).mockResolvedValue(["apps/home/page.tsx"]);

    const result = await compiler.buildRouteInfo();

    expect(result).toEqual([
      {
        route: "/home",
        filePath: "apps/home/page.tsx",
        subRoutes: [],
      },
    ]);
  });

  it("should correctly build route info for nested pages", async () => {
    (glob.glob as jest.Mock).mockResolvedValue([
      "apps/home/page.tsx",
      "apps/dashboard/settings/page.tsx",
    ]);

    const result = await compiler.buildRouteInfo();

    expect(result).toEqual([
      {
        route: "/home",
        filePath: "apps/home/page.tsx",
        subRoutes: [],
      },
      {
        route: "/dashboard",
        subRoutes: [
          {
            route: "/dashboard/settings",
            filePath: "apps/dashboard/settings/page.tsx",
            subRoutes: [],
          },
        ],
      },
    ]);
  });

  it("should handle nested page", async () => {
    (glob.glob as jest.Mock).mockResolvedValue([
      "apps/home/page.tsx",
      "apps/home/nested/page.tsx",
      "apps/dashboard/nested/page.tsx",
    ]);

    const result = await compiler.buildRouteInfo();

    expect(result).toEqual([
      {
        route: "/home",
        filePath: "apps/home/page.tsx",
        subRoutes: [
          {
            route: "/home/nested",
            filePath: "apps/home/nested/page.tsx",
            subRoutes: [],
          },
        ],
      },
      {
        route: "/dashboard",
        subRoutes: [
          {
            route: "/dashboard/nested",
            filePath: path.join(
              mockOptions.rootDir,
              "dashboard/nested/page.tsx",
            ),
            subRoutes: [],
          },
        ],
      },
    ]);
  });

  it("should return an empty array when no pages are found", async () => {
    (glob.glob as jest.Mock).mockResolvedValue([]);

    const result = await compiler.buildRouteInfo();

    expect(result).toEqual([]);
  });

  it("should correctly handle the PAGE_FILE_PATTERN", async () => {
    await compiler.buildRouteInfo();

    expect(glob.glob).toHaveBeenCalledWith("**/page.tsx", {
      cwd: mockOptions.rootDir,
    });
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

  it("should compile a single page", async () => {
    const mockPages = ["/path/to/project/home/page.tsx"];
    (require("glob").glob.glob as jest.Mock).mockResolvedValue(mockPages);
    (swc.transformFile as jest.Mock).mockResolvedValue({
      code: "compiled code",
    });
    (readMetadata as jest.Mock).mockResolvedValue({ title: "Home" });

    const result = await compiler.compile();

    expect(result).toEqual({
      routes: [
        {
          route: "/home",
          filePath: "/path/to/output/path/to/project/home/page.js",
          subRoutes: [],
          metadata: { title: "Home" },
        },
      ],
      componentKeyMap: {
        key1: {
          route: "/home",
        },
        key2: {
          route: "/home",
        },
      },
    });
  });

  it("should compile nested pages", async () => {
    const mockPages = [
      "/path/to/project/home/page.tsx",
      "/path/to/project/home/nested/page.tsx",
      "/path/to/project/admin/page.tsx",
    ];
    (require("glob").glob.glob as jest.Mock).mockResolvedValue(mockPages);
    (swc.transformFile as jest.Mock).mockResolvedValue({
      code: "compiled code",
    });
    (readMetadata as jest.Mock)
      .mockResolvedValueOnce({ title: "Nested" })
      .mockResolvedValueOnce({ title: "Home" });
    (extractJSXKeyAttributes as jest.Mock)
      .mockResolvedValueOnce([
        {
          value: "key1",
        },
        {
          value: "key2",
        },
      ])
      .mockResolvedValueOnce([
        {
          value: "key3",
        },
        {
          value: "key4",
        },
      ])
      .mockResolvedValueOnce([
        {
          value: "key5",
        },
        {
          value: "key6",
        },
      ]);

    const result = await compiler.compile();

    expect(result).toEqual({
      routes: [
        {
          route: "/home",
          filePath: "/path/to/output/path/to/project/home/page.js",
          subRoutes: [
            {
              route: "/home/nested",
              filePath: "/path/to/output/path/to/project/home/nested/page.js",
              subRoutes: [],
              metadata: { title: "Nested" },
            },
          ],
          metadata: { title: "Home" },
        },
        {
          route: "/admin",
          filePath: "/path/to/output/path/to/project/admin/page.js",
          subRoutes: [],
          metadata: {
            title: "Home",
          },
        },
      ],
      componentKeyMap: {
        key1: {
          route: "/home",
        },
        key2: {
          route: "/home",
        },
        key3: {
          route: "/home/nested",
        },
        key4: {
          route: "/home/nested",
        },
        key5: {
          route: "/admin",
        },
        key6: {
          route: "/admin",
        },
      },
    });
    expect(swc.transformFile).toHaveBeenCalledTimes(3);
    expect(readMetadata).toHaveBeenCalledTimes(3);
  });

  it("should throw error if duplicate found", async () => {
    const mockPages = [
      "/path/to/project/home/page.tsx",
      "/path/to/project/home/nested/page.tsx",
    ];
    (require("glob").glob.glob as jest.Mock).mockResolvedValue(mockPages);
    (swc.transformFile as jest.Mock).mockResolvedValue({
      code: "compiled code",
    });
    (readMetadata as jest.Mock)
      .mockResolvedValueOnce({ title: "Nested" })
      .mockResolvedValueOnce({ title: "Home" });
    (extractJSXKeyAttributes as jest.Mock).mockResolvedValueOnce([
      {
        value: "key1",
      },
      {
        value: "key1",
      },
    ]);

    await expect(() => compiler.compile()).rejects.toThrow(
      "Duplicate key found: key1 in /path/to/project/home/page.tsx",
    );
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
      routes: [],
      componentKeyMap: {},
    });
    expect(swc.transformFile).not.toHaveBeenCalled();
    expect(readMetadata).not.toHaveBeenCalled();
  });
});
