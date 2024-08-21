import path from "path";
import { CompilerUtils } from "./compiler";

describe("CompilerUtils", () => {
  const testCases = [
    {
      sourceCodePath: path.join(
        __dirname,
        "../../tests/mock/single-default-client-component.tsx",
      ),
      expected: [
        'SingleDefaultClientComponent.$$typeof = Symbol("react.element.client");',
      ],
    },
    {
      sourceCodePath: path.join(
        __dirname,
        "../../tests/mock/multiple-exports-client-component.tsx",
      ),
      expected: [
        'ClientComponent1.$$typeof = Symbol("react.element.client")',
        'ClientComponent2.$$typeof = Symbol("react.element.client")',
      ],
    },
  ];

  for (const testCase of testCases) {
    it("should be able to compile client component if use client is defined", async () => {
      //swc should not be mocked here
      const utils = new CompilerUtils("", "");
      const result = await utils.buildSourceCode(testCase.sourceCodePath);
      for (const expected of testCase.expected) {
        expect(result.code).toContain(expected);
      }
    });
  }
});
