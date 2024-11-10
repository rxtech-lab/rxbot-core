import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach } from "node:test";
import { CliInteraction } from "./cli-tools";

describe("create-rx-bot", () => {
  const PROJECT_NAME = "test-bot";
  const currentDir = process.cwd();
  const projectDir = path.resolve(currentDir, PROJECT_NAME);
  let cli: CliInteraction;

  afterEach(async () => {
    if (existsSync(projectDir)) {
      await fs.rm(projectDir, { recursive: true });
    }
    cli?.cleanup();
  });

  it("should be able to build", async () => {
    execSync("pnpm build");
    cli = new CliInteraction({
      command: "create-rx-bot",
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

    await cli.waitForOutput(/Successfully created test-bot/, 60_000);
  }, 120_000);
});
