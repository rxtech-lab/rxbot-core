import { Logger } from "@rx-lab/common";
import render from "./render";

// spy on Logger.info
const mockLoggerInfo = jest.spyOn(Logger, "info").mockImplementation(() => {});
// mock fs
jest.mock("node:fs", () => ({
  existsSync: jest.fn(),
}));

jest.mock("node:fs/promises", () => {
  const originalModule = jest.requireActual("node:fs/promises");
  return {
    ...originalModule,
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  };
});

describe("render", () => {
  const testCases = [
    {
      options: {
        projectName: "test",
      },
    },
  ];

  for (const testCase of testCases) {
    it("should render the template", async () => {
      const templateFile = await render(true, testCase.options);
      const calls = mockLoggerInfo.mock.calls;
      // get all calls with Executing
      const executingCalls = calls.filter((call) =>
        call[0].includes("Executing"),
      );

      // get all calls with Writing
      const writingCalls = calls.filter((call) => call[0].includes("Writing"));

      const hookCount = templateFile.files.reduce((acc, file) => {
        if (file.hooks) {
          return acc + Object.keys(file.hooks).length;
        }
        return acc;
      }, 0);

      expect(executingCalls).toHaveLength(hookCount);
      expect(writingCalls).toHaveLength(templateFile.files.length);
    });
  }
});
