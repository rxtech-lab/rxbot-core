import { Logger } from "@rx-lab/common";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import build from "./commands/build/build";
import deploy from "./commands/deploy";
import dev from "./commands/dev";

/**
 * Get build environment.
 * If building on Vercel, return "vercel"
 * @param argv
 */
function getEnvironment(argv: any) {
  const isVercel = process.env.VERCEL;
  if (isVercel) {
    return "vercel";
  }
  return argv.environment;
}

export async function runRxbot() {
  await yargs(hideBin(process.argv))
    .command({
      command: "build",
      describe: "Build the application",
      builder: {
        environment: {
          alias: "e",
          type: "string",
          description: "Specify the environment",
          default: "local",
        },
      },
      handler: async (argv) => {
        Logger.log("Running command build", "blue");
        await build(undefined, undefined, {
          environment: getEnvironment(argv),
        });
      },
    })
    .command({
      command: "dev",
      describe: "Run in development mode",
      handler: async () => {
        Logger.log("Running command dev", "blue");
        await dev();
      },
    })
    .command({
      command: "deploy",
      describe: "Deploy the application",
      handler: async () => {
        Logger.log("Running command deploy", "blue");
        await deploy();
      },
    })
    .demandCommand(1, "You need to specify a command")
    .help()
    .strict().argv;
}
