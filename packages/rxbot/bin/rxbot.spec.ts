import { Logger } from "@rx-lab/common";
import build from "../src/command/commands/build/build";
import { runRxbot } from "../src/command/run-command";

jest.mock("@rx-lab/common");
jest.mock("../src/command/commands/build/build");

// Mock process.exit to prevent tests from actually exiting
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit called");
});

// Mock console.error to suppress yargs error output in tests
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("runRxbot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("should run the build command", async () => {
    process.argv = ["node", "rxbot", "build"];
    await runRxbot();
    expect(Logger.log).toHaveBeenCalledWith("Running command build", "blue");
    expect(build).toHaveBeenCalledWith(undefined, undefined, {
      environment: "local",
    });
  });

  it("should run the build command with environment", async () => {
    process.argv = ["node", "rxbot", "build", "--environment", "vercel"];
    await runRxbot();
    expect(Logger.log).toHaveBeenCalledWith("Running command build", "blue");
    expect(build).toHaveBeenCalledWith(undefined, undefined, {
      environment: "vercel",
    });
  });

  it("should exit with error for unknown command", async () => {
    process.argv = ["node", "rxbot", "unknown"];
    await expect(runRxbot()).rejects.toThrow("process.exit called");
    // Yargs will handle the error message differently, so we don't test for specific log message
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should exit with error when no command is provided", async () => {
    process.argv = ["node", "rxbot"];
    await expect(runRxbot()).rejects.toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should display help information", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    process.argv = ["node", "rxbot", "--help"];

    await expect(runRxbot()).rejects.toThrow("process.exit called");
    expect(consoleSpy).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);

    consoleSpy.mockRestore();
  });
});
