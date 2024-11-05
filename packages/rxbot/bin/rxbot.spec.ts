import { Logger } from "@rx-lab/common";

import { runBuild } from "./commands/build";
import { runRxbot } from "./run-command";

jest.mock("@rx-lab/common");
jest.mock("./commands/build");

describe("runRxbot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should run the build command", async () => {
    process.argv = ["node", "rxbot", "build"];
    await runRxbot();
    expect(Logger.log).toHaveBeenCalledWith("Running command build", "blue");
    expect(runBuild).toHaveBeenCalled();
  });

  it("should log an error for an unknown command", async () => {
    process.argv = ["node", "rxbot", "unknown"];
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await expect(() => runRxbot()).rejects.toThrow("process.exit called");
    expect(Logger.log).toHaveBeenCalledWith("Command unknown not found", "red");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
