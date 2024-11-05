import * as fs from "fs";
import { describe } from "node:test";
import * as path from "path";
import * as swc from "@swc/core";
import { glob } from "glob";
import {
  BuildSourceCodeOutput,
  Compiler,
  CompilerOptions,
  CompilerUtils,
  RoutePath,
} from "./compiler";
import { extractJSXKeyAttributes, readMetadata } from "./utils";
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

describe("Compiler.createRoutePath", () => {
  const testCases: {
    filePath: string;
    artifacts: BuildSourceCodeOutput[];
    rootPath: string;
    expected: RoutePath;
  }[] = [
    {
      filePath: "src/app/state/page.tsx",
      artifacts: [
        {
          ast: {} as any,
          sourceCodePath: "src/app/state/page.tsx",
        },
      ],
      rootPath: "src",
      expected: {
        route: "/state",
        subRoutes: [],
        "404": undefined,
        error: undefined,
        page: "./src/app/state/page.tsx",
      },
    },
    //absolute path
    {
      filePath: "/usr/projects/rxbot/src/app/state/page.tsx",
      artifacts: [
        {
          ast: {} as any,
          sourceCodePath: "/usr/projects/rxbot/src/app/state/page.tsx",
        },
      ],
      rootPath: "/usr/projects/rxbot/src",
      expected: {
        route: "/state",
        subRoutes: [],
        "404": undefined,
        error: undefined,
        page: "/usr/projects/rxbot/src/app/state/page.tsx",
      },
    },
  ];

  for (const testCase of testCases) {
    it("should create route path", async () => {
      const compiler = new Compiler({
        rootDir: testCase.rootPath,
      });
      const routePath = compiler.createRoutePath(
        testCase.filePath,
        testCase.artifacts,
      );
      expect(routePath).toStrictEqual(testCase.expected);
    });
  }
});
