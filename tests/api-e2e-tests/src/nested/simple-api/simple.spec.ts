import fs from "fs";
import path from "node:path";
import { CLIProcessManager } from "@rx-lab/testing";
import { sleep } from "../utils";

describe("simple nested api", () => {
  let cliProcess: CLIProcessManager;

  beforeEach(() => {
    cliProcess = new CLIProcessManager();
  });

  it("Should be able to build nested api and run", async () => {
    const srcFolder = path.resolve(__dirname);
    const outputFolder = path.resolve(__dirname, ".vercel");

    await cliProcess.start("rxbot", ["build", "-e", "vercel"], {
      cwd: srcFolder,
    });

    await sleep(1000);

    // check files exists
    const files = [
      "output/functions/api/webhook.func/index.js",
      "output/functions/api/nested.func/index.js",
      "output/functions/api.func/index.js",
    ];
    for (const file of files) {
      const filePath = path.resolve(outputFolder, file);
      expect(fs.existsSync(filePath)).toBeTruthy();
    }
  });
});
