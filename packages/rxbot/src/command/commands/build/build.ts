import path from "path";
import { DEFAULT_OUTPUT_FOLDER, Logger } from "@rx-lab/common";
import { VercelEnvironmentPlugin } from "../../../plugins/vercel.environment.plugin";
import { buildApp } from "./build-app";
import { buildVercel } from "./build-vercel";

type SupportedEnvironments = "local" | "vercel";

interface Options {
  hasAdapterFile?: boolean;
  environment?: SupportedEnvironments;
  sourceMap?: boolean;
}

// Build command
export default async function runBuild(
  srcFolder = "./src",
  outputFolder = "./",
  options: Options = {
    environment: "local",
    hasAdapterFile: true,
    sourceMap: false,
  },
) {
  Logger.info(
    `Building the app in ${srcFolder} for ${options.environment} environment`,
    "blue",
  );

  switch (options.environment) {
    case "vercel":
      Logger.info("Building specifically for Vercel", "blue");
      await buildApp(srcFolder, outputFolder, options.hasAdapterFile ?? true, {
        plugins: [new VercelEnvironmentPlugin()],
      });
      await buildVercel({
        outputFolder: path.resolve(
          process.cwd(),
          outputFolder,
          DEFAULT_OUTPUT_FOLDER,
        ),
      });
      Logger.info("Build for Vercel completed successfully", "green");
      break;
    default:
      await buildApp(srcFolder, outputFolder, options.hasAdapterFile ?? true, {
        sourceMap: options.sourceMap,
        plugins: [],
      });
      Logger.info("Build app completed successfully", "green");
      break;
  }
}
