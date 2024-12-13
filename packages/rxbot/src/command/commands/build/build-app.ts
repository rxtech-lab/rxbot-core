import fs from "fs";
import path from "path";
import { defineConfig } from "@rspack/cli";
import { Plugin } from "@rspack/core";
import { RspackOptions, rspack } from "@rspack/core";
import { Logger } from "@rx-lab/common";
import { getRspackConfig, getSrcAndOutputDir } from "../../utils";

interface Options {
  plugins: Plugin[];
}

/**
 * Build and bundle the app with all the necessary files and dependencies
 * @param srcFolder The source folder of the app
 * @param outputFolder The output folder of the app
 * @param hasAdapterFile If the app has an adapter file. If this field is false, then you need to provide the adapter during the core's initialization
 * @param options Options for the build
 */
export async function buildApp(
  srcFolder: string,
  outputFolder: string,
  hasAdapterFile: boolean,
  options?: Options,
) {
  return new Promise((resolve, reject) => {
    try {
      // Get the current working directory
      const { outputPath, tempFolder, cwd } = getSrcAndOutputDir(
        srcFolder,
        outputFolder,
      );
      // Default config
      const defaultConfig = getRspackConfig(srcFolder, tempFolder, outputPath, {
        hasAdapterFile,
        plugins: options?.plugins ?? [],
      });
      // Try to load user config
      let userConfig: RspackOptions = {};
      const userConfigPath = path.resolve(cwd, "rspack.config.ts");
      if (fs.existsSync(userConfigPath)) {
        Logger.log(`Using user config from ${userConfigPath}`, "blue");
        userConfig = require(userConfigPath).default;
      }

      // Merge configs
      // TODO: Improve config merging by adding plugins merging
      const config = defineConfig({
        ...defaultConfig,
        ...userConfig,
      });

      // Run build
      const compiler = rspack(config);

      compiler.run((err, stats) => {
        if (err) {
          Logger.log("Build failed with error:", "red");
          reject(err);
        }

        if (stats?.hasErrors()) {
          Logger.log("Build failed with errors:", "red");
          const errors = stats.toJson().errors;
          Logger.log(JSON.stringify(errors), "red");
          reject(errors);
          return;
        }

        compiler.close((closeErr) => {
          if (closeErr) {
            console.error("Compiler close failed:", closeErr);
          }
          resolve(void 0);
        });
      });
    } catch (error) {
      console.error("Build failed:", error);
      process.exit(1);
    }
  });
}
