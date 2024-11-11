import { existsSync } from "fs";
import path from "path";
import { defineConfig } from "@rspack/cli";
import { RspackOptions, rspack } from "@rspack/core";
import { RspackDevServer } from "@rspack/dev-server";
import { Logger } from "@rx-lab/common";
import { Core } from "@rx-lab/core";
import chokidar from "chokidar";
import express from "express";
import fs from "fs/promises";
import { getRspackConfig, getSrcAndOutputDir } from "../utils";

export default async function runDev(srcFolder = "./src", outputFolder = "./") {
  try {
    Logger.shouldLog = true;
    const { outputPath, tempFolder, cwd, srcPath } = getSrcAndOutputDir(
      srcFolder,
      outputFolder,
    );
    await fs.rm(outputPath, { recursive: true, force: true });

    // Default config
    const defaultConfig = getRspackConfig(srcPath, tempFolder, outputPath, {
      hasAdapterFile: true,
    });

    // Try to load user config
    let userConfig: RspackOptions = {};
    const userConfigPath = path.resolve(cwd, "rspack.config.ts");
    if (existsSync(userConfigPath)) {
      Logger.log(`Using user config from ${userConfigPath}`, "blue");
      userConfig = require(userConfigPath).default;
    }

    // Merge configs
    const config = defineConfig({
      ...defaultConfig,
      ...userConfig,
      watch: true,
      stats: "errors-only",
      infrastructureLogging: {
        level: "warn",
      },
      devServer: {
        port: 3000,
        hot: true,
        // Disable frontend-specific features
        open: false,
        client: false,
        static: false,
        allowedHosts: "all",
        host: "0.0.0.0",
        devMiddleware: {
          writeToDisk: true,
        },
        // Configure API middleware
        setupMiddlewares: (middlewares, devServer) => {
          const app = devServer.app!;

          // Parse JSON bodies
          app.use(express.json());

          const watcher = chokidar.watch(srcFolder, {
            ignored: /node_modules/,
            persistent: true,
          });

          // Watch for file changes
          watcher.on("change", (path) => {
            try {
              devServer.invalidate((stats) => {
                if (stats?.hasErrors()) {
                  Logger.log(
                    "Build encountered errors but server keeps running",
                    "yellow",
                  );
                } else {
                  Logger.log("Build complete", "green");
                }
              });
            } catch (error: any) {
              Logger.log(`Error during rebuild: ${error.message}`, "red");
              // Continue running despite errors
            }
          });

          watcher.on("add", (path) => {
            Logger.log(`File added: ${path}`, "yellow");
            try {
              devServer.invalidate((stats) => {
                if (stats?.hasErrors()) {
                  Logger.log(
                    "Build encountered errors but server keeps running",
                    "yellow",
                  );
                } else {
                  Logger.log("Build complete", "green");
                }
              });
            } catch (error: any) {
              Logger.log(`Error during rebuild: ${error.message}`, "red");
              // Continue running despite errors
            }
          });

          watcher.on("unlink", (path) => {
            Logger.log(`File removed: ${path}`, "yellow");
            try {
              devServer.invalidate((stats) => {
                if (stats?.hasErrors()) {
                  Logger.log(
                    "Build encountered errors but server keeps running",
                    "yellow",
                  );
                } else {
                  Logger.log("Build complete", "green");
                }
              });
            } catch (error: any) {
              Logger.log(`Error during rebuild: ${error.message}`, "red");
              // Continue running despite errors
            }
          });

          // API endpoint
          app.post("/api/webhook", async (req, res) => {
            try {
              // Clear the module from Node's cache
              const modulePath = path.resolve(outputPath, "main.js");
              // node require
              const nativeRequire = require("module").createRequire(
                process.cwd(),
              );
              delete nativeRequire.cache[nativeRequire.resolve(modulePath)];

              // Now import the fresh version
              const mod = nativeRequire(modulePath);
              const core = await Core.Dev({
                adapter: mod.adapter,
                storage: mod.storage,
                routeFile: mod.ROUTE_FILE,
              });
              await core.handleMessageUpdate(req.body);
              res.json({ success: true });
              await core.onDestroy();
            } catch (error: any) {
              console.error("Error processing message:", error);
              res.status(500).json({ error: error.message });
            }
          });
          app.post("/api/send-message", async (req, res) => {
            try {
              // Clear the module from Node's cache
              const modulePath = path.resolve(outputPath, "main.js");
              delete require.cache[require.resolve(modulePath)];

              // Now import the fresh version
              const mod = await import(
                modulePath + "?update=" + Date.now()
              ).then((mod) => mod.default);

              const core = await Core.Start({
                adapter: mod.adapter,
                storage: mod.storage,
                routeFile: mod.ROUTE_FILE,
              });

              await core.sendMessage(req.body);
              res.json({ success: true });
              await core.onDestroy();
            } catch (error: any) {
              console.error("Error processing message:", error);
              res.status(500).json({ error: error.message });
            }
          });

          return middlewares;
        },
      },
      // Disable unnecessary optimizations for backend
    });

    // Run server
    const compiler = rspack(config, () => {});
    const server = new RspackDevServer(config.devServer!, compiler!);

    await server.start();
    Logger.log(
      `API server running at http://localhost:${config.devServer?.port}`,
      "green",
    );
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}
