import { Logger } from "@rx-lab/common";
import { runBuild } from "./commands/build";

export async function runRxbot() {
  // get user command
  // should start with rxbot and then the command
  // e.g. rxbot build

  // get the command
  const command = process.argv[2];
  switch (command) {
    case "build":
      Logger.log(`Running command ${command}`, "blue");
      await runBuild();
      break;
    default:
      Logger.log(`Command ${command} not found`, "red");
      process.exit(1);
  }
}
