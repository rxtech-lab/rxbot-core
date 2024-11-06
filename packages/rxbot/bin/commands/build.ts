import fs from "fs";
import path from "path";
import { defineConfig } from "@rspack/cli";
import { RspackOptions, rspack } from "@rspack/core";
import { Logger } from "@rx-lab/common";
import { getRspackConfig, getSrcAndOutputDir } from "../utils";

// Build command
export default async function runBuild(srcFolder = "./src") {
  return new Promise((resolve, reject) => {
    try {
      // Get the current working directory
      const { outputDir, tempFolder, cwd } = getSrcAndOutputDir(srcFolder);
      Logger.log(`Output will be in ${outputDir}`, "blue");
      // Default config
      const defaultConfig = getRspackConfig(srcFolder, tempFolder);
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
          process.exit(1);
        }

        if (stats?.hasErrors()) {
          Logger.log("Build failed with errors:", "red");
          Logger.log(stats.toString(), "red");
          process.exit(1);
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