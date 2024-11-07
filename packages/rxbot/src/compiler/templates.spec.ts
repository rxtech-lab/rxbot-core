import * as swc from "@swc/core";
import {
  DEFAULT_404_PAGE,
  DEFAULT_ERROR_PAGE,
  DEFAULT_PAGE,
} from "./templates";

describe("Should be able to compile templates", () => {
  const testCases = [
    {
      template: DEFAULT_404_PAGE,
    },
    {
      template: DEFAULT_ERROR_PAGE,
    },
    {
      template: DEFAULT_PAGE,
    },
  ];

  for (const testCase of testCases) {
    it("should be able to compile templates", async () => {
      const compiler = await swc.transform(testCase.template, {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
          target: "es2016",
        },
        module: {
          type: "commonjs",
        },
      });
      expect(compiler.code.length).toBeGreaterThan(0);
    });
  }
});
