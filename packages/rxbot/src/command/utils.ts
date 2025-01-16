import path from "path";
import { RspackOptions } from "@rspack/core";
import { Plugin } from "@rspack/core";
import {
  DEFAULT_OUTPUT_FOLDER,
  Logger,
  RouteInfo,
  RouteInfoFile,
  RouteMetadata,
} from "@rx-lab/common";
import { BuildAppPlugin } from "../plugins/build-app.plugin";

interface Options {
  hasAdapterFile: boolean;
  plugins: Plugin[];
  sourceMap?: boolean;
}

export function getRspackConfig(
  sourceDir: string,
  tempDir: string,
  outputDir: string,
  options: Options,
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
    devtool: options.sourceMap === true ? "source-map" : undefined,
    plugins: [
      new BuildAppPlugin({
        sourceDir: sourceDir,
        outputDir: tempDir,
        hasAdapterFile: options.hasAdapterFile,
      }),
      ...options.plugins,
    ],
  };
}

export function getSrcAndOutputDir(srcFolder: string, outputFolder: string) {
  const cwd = process.cwd();
  Logger.info(`Current working directory is ${cwd}`, "red");
  const outputPath = path.resolve(cwd, outputFolder, DEFAULT_OUTPUT_FOLDER);
  const tempFolder = path.resolve(cwd, outputPath, "temp");
  const srcPath = path.resolve(cwd, srcFolder);
  Logger.info(`Source is ${srcPath}`, "red");
  Logger.info(`Output will be in ${outputPath}`, "red");
  return { cwd, srcPath, tempFolder, outputPath };
}

export function isRouteMetadataEqual(
  a?: RouteInfoFile,
  b?: RouteInfoFile,
): boolean {
  if (!a || !b) {
    return false;
  }

  // Helper function to compare metadata objects
  function isMetadataEqual(
    metadataA?: RouteMetadata,
    metadataB?: RouteMetadata,
  ): boolean {
    // If both are undefined, they're equal
    if (!metadataA && !metadataB) {
      return true;
    }
    // If only one is undefined, they're not equal
    if (!metadataA || !metadataB) {
      return false;
    }

    return (
      metadataA.title === metadataB.title &&
      metadataA.description === metadataB.description &&
      metadataA.includeInMenu === metadataB.includeInMenu
    );
  }

  // Helper function to compare subroutes
  function areSubRoutesEqual(
    subRoutesA?: RouteInfo[],
    subRoutesB?: RouteInfo[],
  ): boolean {
    // If both are undefined, they're equal
    if (!subRoutesA && !subRoutesB) {
      return true;
    }
    // If only one is undefined, they're not equal
    if (!subRoutesA || !subRoutesB) {
      return false;
    }
    // If lengths are different, they're not equal
    if (subRoutesA.length !== subRoutesB.length) {
      return false;
    }

    // Compare each subroute recursively
    for (let i = 0; i < subRoutesA.length; i++) {
      const routeA = subRoutesA[i];
      const routeB = subRoutesB[i];

      // Compare metadata
      if (!isMetadataEqual(routeA.metadata, routeB.metadata)) {
        return false;
      }

      // Recursive check for nested subroutes
      if (!areSubRoutesEqual(routeA.subRoutes, routeB.subRoutes)) {
        return false;
      }
    }

    return true;
  }

  // First check if the top-level routes array length matches
  if (a.routes.length !== b.routes.length) {
    return false;
  }

  // Compare each route
  for (let i = 0; i < a.routes.length; i++) {
    const routeA = a.routes[i];
    const routeB = b.routes[i];

    // Compare metadata
    if (!isMetadataEqual(routeA.metadata, routeB.metadata)) {
      return false;
    }

    // Compare subroutes recursively
    if (!areSubRoutesEqual(routeA.subRoutes, routeB.subRoutes)) {
      return false;
    }
  }

  return true;
}
