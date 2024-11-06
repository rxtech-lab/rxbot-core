import fs from "fs";
import path from "path";
import { defineConfig } from "@rspack/cli";
import { RspackOptions, rspack } from "@rspack/core";
import { RspackDevServer } from "@rspack/dev-server";
import { Logger } from "@rx-lab/common";
import express from "express";
import { getRspackConfig, getSrcAndOutputDir } from "../utils";

export default async function runDev(srcFolder = "./src") {
  try {
    const { outputDir, tempFolder, cwd } = getSrcAndOutputDir(srcFolder);
    Logger.log(`Output will be in ${outputDir}`, "blue");

    // Default config
    const defaultConfig = getRspackConfig(srcFolder, tempFolder, outputDir);

    // Try to load user config
    let userConfig: RspackOptions = {};
    const userConfigPath = path.resolve(cwd, "rspack.config.ts");
    if (fs.existsSync(userConfigPath)) {
      Logger.log(`Using user config from ${userConfigPath}`, "blue");
      userConfig = require(userConfigPath).default;
    }

    // Merge configs
    const config = defineConfig({
      ...defaultConfig,
      ...userConfig,
      target: "node", // Target Node.js environment
      output: {
        ...defaultConfig.output,
        ...userConfig.output,
        path: outputDir,
        filename: "server.js",
        clean: true,
      },
      devServer: {
        port: 3000,
        hot: true,
        // Disable frontend-specific features
        open: false,
        client: false,
        static: false,
        // Configure API middleware
        setupMiddlewares: (middlewares, devServer) => {
          const app = devServer.app!;

          // Parse JSON bodies
          app.use(express.json());

          // API endpoint
          app.post("/api/send-message", async (req, res) => {
            //@ts-ignore
            const mod = await import(path.resolve(outputDir, "index.js"));

            const body = req.body;
            // biome-ignore lint/suspicious/noConsoleLog: <explanation>
            console.log("Received message:", body);
            res.json({ success: true });
          });

          return middlewares;
        },
      },
      // Disable unnecessary optimizations for backend
      optimization: {
        minimize: false,
        splitChunks: false,
      },
    });

    // Run server
    const compiler = rspack(config);
    const server = new RspackDevServer(config.devServer!, compiler);

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
