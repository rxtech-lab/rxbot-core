import * as path from "path";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";

export default defineConfig({
  entry: {
    main: "./src/index.ts",
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"), // Use absolute path
    library: {
      type: "commonjs2",
    },
  },
  target: "node",
  resolve: {
    extensions: [".ts", ".js", ".json", ".tsx"],
    alias: {
      "sourcecraft-core/node": path.resolve(
        __dirname,
        "node_modules/sourcecraft-core/dist/node.js",
      ),
    },
  },
  externals: [
    /^@swc/,
    /^@rspack/,
    // Add pattern for native modules
    /\.node$/,
    "express",
    ({ request }, callback) => {
      if (
        request === "sourcecraft-core" ||
        request?.startsWith("sourcecraft-core/")
      ) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "ecmascript",
                },
              },
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                },
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new rspack.node.NodeTargetPlugin(),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/templates"),
          to: path.resolve(__dirname, "dist/templates"),
        },
      ],
    }),
  ],
  optimization: {
    minimize: false,
    splitChunks: false,
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  devtool: false,
});
