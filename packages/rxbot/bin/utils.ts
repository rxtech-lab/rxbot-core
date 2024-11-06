import path from "path";
import { RspackOptions } from "@rspack/core";
import { BuildAppPlugin } from "../src/plugins/build-app.plugin";

export function getRspackConfig(
  sourceDir: string,
  tempDir: string,
  outputDir: string,
): RspackOptions {
  const entry = path.resolve(tempDir, "index.ts");
  return {
    entry: entry,
    output: {
      filename: "index.js",
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
      }),
      // new RemoveTempPlugin({
      //   outputDir: outputDir,
      // }),
    ],
  };
}

export function getSrcAndOutputDir(srcFolder: string) {
  const cwd = process.cwd();
  const outputDir = path.resolve(".rx-lab");
  const tempFolder = path.resolve(outputDir, "temp");
  return { cwd, srcFolder, tempFolder, outputDir };
}
