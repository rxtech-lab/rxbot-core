import path from "path";
import { DEFAULT_OUTPUT_FOLDER, Logger } from "@rx-lab/common";
import { buildApp } from "./build-app";
import { buildVercel } from "./build-vercel";

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
      await buildVercel({
        outputFolder: path.resolve(outputFolder, DEFAULT_OUTPUT_FOLDER),
      });
      Logger.info("Build for Vercel completed successfully", "green");
      break;
    default:
      // if local, just build the app
      break;
  }
}
