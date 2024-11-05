import fs from "fs";
import path from "path";
import { defineConfig } from "@rspack/cli";
// src/cli.ts
import { RspackOptions, rspack } from "@rspack/core";
import { Logger } from "@rx-lab/common";
import * as glob from "glob";

function getPageEntries(): string[] {
  const pages = glob.sync("./src/app/**/page.{ts,tsx}");
  const entries: string[] = [];
  for (const page of pages) {
    entries.push(path.resolve(page));
  }
  return entries;
}

// Build command
export async function runBuild() {
  try {
    // Get the current working directory
    const cwd = process.cwd();
    Logger.log(`Building project in ${cwd}`, "blue");
    const entries = getPageEntries();
    const outputDir = path.resolve(".rx-lab");
    Logger.log(`Found ${Object.keys(entries).length} entries`, "blue");
    Logger.log(`Output will be in ${outputDir}`, "blue");
    // Default config
    const defaultConfig: RspackOptions = {
      entry: entries,
      output: {
        filename: "[name].js",
        chunkFilename: "chunks/[name].[contenthash].js",
        path: outputDir,
        publicPath: "/",
        libraryTarget: "umd",
        enabledLibraryTypes: ["umd"],
      },
      target: ["node", "es2020"],
      // skip any @rx-lab/* packages
      // and react, react-dom, react/jsx-runtime
      externals: [/^@rx-lab\//, "react", "react-dom", "react/jsx-runtime"],
      resolve: {
        extensions: [".ts", ".js", ".json", ".tsx"],
        alias: {
          "@": path.resolve(__dirname, "src"),
        },
      },
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            use: [
              {
                loader: "builtin:swc-loader",
                options: {
                  jsc: {
                    parser: {
                      syntax: "typescript",
                    },
                    target: "es2020",
                  },
                },
              },
            ],
          },
        ],
      },
      optimization: {
        splitChunks: {
          chunks: "all",
          minSize: 0,
        },
      },
    };

    // Try to load user config
    let userConfig: RspackOptions = {};
    const userConfigPath = path.resolve(cwd, "rspack.config.ts");
    if (fs.existsSync(userConfigPath)) {
      userConfig = require(userConfigPath).default;
    }

    // Merge configs
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
      });
    });
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}
