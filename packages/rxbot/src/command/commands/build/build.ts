import { Logger } from "@rx-lab/common";
import { buildApp } from "./build-app";

type SupportedEnvironments = "local" | "vercel";

interface Options {
  hasAdapterFile?: boolean;
  environment?: SupportedEnvironments;
}

// Build command
export default async function runBuild(
  srcFolder = "./src",
  outputFolder = "./",
  options: Options = {
    environment: "local",
    hasAdapterFile: true,
  },
) {
  Logger.info(
    `Building the app in $${srcFolder} for ${options.environment} environment`,
    "blue",
  );
  // first build the app
  await buildApp(srcFolder, outputFolder, options.hasAdapterFile ?? true);
  Logger.info("Build app completed successfully", "green");
  switch (options.environment) {
    case "vercel":
      Logger.info("Building specifically for Vercel", "blue");
      // if vercel, build the app for vercel

      break;
    default:
      // if local, just build the app
      break;
  }
}
