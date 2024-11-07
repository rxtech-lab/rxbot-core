import * as path from "path";
import { Logger } from "@rx-lab/common";
import { Core } from "@rx-lab/core";
import runDeploy from "./deploy";
import * as vercelDeploy from "./deploy-vercel";

// Mock dependencies
jest.mock("path");
jest.mock("@rx-lab/core");
jest.mock("@rx-lab/common");
jest.mock("./deploy-vercel");
jest.mock("@swc/core", () => ({
  transformFile: jest.fn().mockResolvedValue({
    code: "module.exports.default = { webhook: {} };",
  }),
}));

// Mock require functionality
const mockRequire = {
  adapter: {},
  storage: {},
  ROUTE_FILE: "routes.json",
};

jest.mock("module", () => ({
  createRequire: () => () => mockRequire,
}));

describe("runDeploy", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock path.resolve to return predictable values
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join("/"));
  });

  it("should call updateMenu after successful deployment to Vercel", async () => {
    // Mock the Vercel deployment function
    (vercelDeploy.default as jest.Mock).mockResolvedValue(undefined);

    // Call the deploy function
    await runDeploy({ environment: "vercel" });

    // Verify updateMenu was called by checking Core.UpdateMenu was called
    expect(Core.UpdateMenu).toHaveBeenCalledTimes(1);
    expect(Core.UpdateMenu).toHaveBeenCalledWith({
      adapter: mockRequire.adapter,
      storage: mockRequire.storage,
      routeFile: mockRequire.ROUTE_FILE,
    });

    // Verify Logger messages
    expect(Logger.info).toHaveBeenCalledWith(
      "Deploying the app to vercel",
      "blue",
    );
    expect(Logger.info).toHaveBeenCalledWith("Deploying to Vercel", "blue");
    expect(Logger.info).toHaveBeenCalledWith(
      "Menu updated successfully",
      "green",
    );
    expect(Logger.info).toHaveBeenCalledWith(
      "Deploy completed successfully",
      "green",
    );
  });

  it("should throw error for unsupported environment", async () => {
    await expect(
      runDeploy({
        // @ts-expect-error Testing invalid environment
        environment: "invalid",
      }),
    ).rejects.toThrow("Unsupported environment: invalid");
  });

  it("should throw error if config loading fails", async () => {
    // Mock transformFile to reject
    const transformFile = require("@swc/core").transformFile;
    transformFile.mockRejectedValueOnce(new Error("Transform failed"));

    await expect(
      runDeploy({
        environment: "vercel",
      }),
    ).rejects.toThrow(/Failed to load config/);
  });
});
