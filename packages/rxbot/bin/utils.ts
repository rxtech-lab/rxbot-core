import path from "path";
import { RspackOptions } from "@rspack/core";
import { BuildAppPlugin } from "../src/plugins/build-app.plugin";
import { RemoveTempPlugin } from "../src/plugins/remove-temp.plugin";

export function getRspackConfig(
  sourceDir: string,
  outputDir: string,
): RspackOptions {
  return {
    entry: path.resolve(outputDir, "index.ts"),
    output: {
      filename: "index.js",
      chunkFilename: "chunks/[name].[contenthash].js",
      path: outputDir,
      publicPath: "/",
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
        outputDir: outputDir,
      }),
      new RemoveTempPlugin({
        outputDir: outputDir,
      }),
    ],
  };
}
