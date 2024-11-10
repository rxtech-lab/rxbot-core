import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach } from "node:test";
import { CliInteraction } from "sourcecraft-core/test";

describe("create-rx-bot", () => {
  const PROJECT_NAME = "test-bot";
  const currentDir = __dirname;
  const projectDir = path.resolve(currentDir, PROJECT_NAME);
  let cli: CliInteraction;

  afterEach(async () => {
    if (existsSync(projectDir)) {
      console.log("removing project dir", projectDir);
      await fs.rm(projectDir, { recursive: true });
    }
    cli?.cleanup();
  });

  it("should be able to build", async () => {
    console.log("currentDir", projectDir);
    execSync("pnpm build:local", {
      cwd: currentDir,
    });
    cli = new CliInteraction({
      command: "create-rx-bot",
      currentDir,
    });
    await cli.waitForOutput(/Package Manager/);
    cli.sendKey("ENTER");

    await cli.waitForOutput(/Project Name/);
    await cli.type(PROJECT_NAME);
    cli.sendKey("ENTER");

    await cli.waitForOutput(/Storage Option/);
    cli.sendKey("ENTER");

    await cli.waitForOutput(/Bot Adapters/);
    cli.sendKey("SPACE");
    cli.sendKey("ENTER");

    await cli.waitForOutput(/Install dependencies/);
    cli.sendKey("ENTER");

    await cli.waitForOutput(
      /Successfully created/,
      process.env.CI ? 60_000 : 20_000,
    );

    //TODO: Uncomment this when new rxbot cli release
    cli = new CliInteraction({
      command: "npm",
      args: ["run", "build"],
      currentDir: projectDir,
    });
    await cli.waitForOutput(/Build app completed successfully/, 12_000);
  }, 120_000);
});
