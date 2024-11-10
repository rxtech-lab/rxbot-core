import * as path from "path";
import { Configuration, rspack } from "@rspack/core";

const outputDir = path.resolve("executables");
const config: Configuration = {
  entry: "./bin/rxbot.ts",
  output: {
    filename: "rxbot.js",
    clean: true,
    path: outputDir,
    library: {
      type: "commonjs2",
    },
  },
  target: "node",
  resolve: {
    extensions: [".ts", ".js", ".json", ".tsx"],
  },
  externals: [
    /^@swc/,
    /^@rspack/,
    // Add pattern for native modules
    /\.node$/,
    "express",
  ],
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
  plugins: [
    new rspack.BannerPlugin({
      banner: "#!/usr/bin/env node",
      raw: true,
      entryOnly: true,
    }),
  ],
  optimization: {
    minimize: false,
    splitChunks: false,
  },
  // Add Node.js specific options
  node: {
    __dirname: false,
    __filename: false,
  },
};

export = config;
