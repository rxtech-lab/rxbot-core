import path from "path";
import { RspackOptions } from "@rspack/core";
import { DEFAULT_OUTPUT_FOLDER } from "@rx-lab/common";
import { BuildAppPlugin } from "../plugins/build-app.plugin";

export function getRspackConfig(
  sourceDir: string,
  tempDir: string,
  outputDir: string,
  options: { hasAdapterFile: boolean },
): RspackOptions {
  const entry = path.resolve(tempDir, "index.ts");
  return {
    entry: entry,
    output: {
      filename: "[name].js",
      chunkFilename: "chunks/[name].[contenthash].js",
      path: outputDir,
      // Change these output settings
      library: {
        type: "commonjs2", // Changed from UMD to CommonJS2
      },
    },
    target: "node", // Simplified target since you're using Node.js
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
    plugins: [
      new BuildAppPlugin({
        sourceDir: sourceDir,
        outputDir: tempDir,
        hasAdapterFile: options.hasAdapterFile,
      }),
    ],
  };
}

export function getSrcAndOutputDir(srcFolder: string, outputFolder: string) {
  const cwd = process.cwd();
  const outputDir = path.resolve(outputFolder, DEFAULT_OUTPUT_FOLDER);
  const tempFolder = path.resolve(outputDir, "temp");
  return { cwd, srcFolder, tempFolder, outputDir };
}