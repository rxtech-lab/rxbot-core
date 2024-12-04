import { existsSync } from "fs";
import path from "path";
import { rspack } from "@rspack/core";
import { RouteInfo } from "@rx-lab/common";
import fs from "fs/promises";
import nunjucks from "nunjucks";
import {
  VERCEL_API_ROUTE_TEMPLATE,
  VERCEL_WEBHOOK_FUNCTION_TEMPLATE,
} from "../../../templates/vercel";

interface Options {
  /**
   * Built app output folder
   */
  outputFolder: string;
}

const VERCEL_FOLDER = ".vercel";
const VERCEL_OUTPUT_FOLDER = path.join(VERCEL_FOLDER, "output");
const VERCEL_FUNCTIONS_FOLDER = path.join(VERCEL_OUTPUT_FOLDER, "functions");
const VERCEL_FUNCTION_CONFIG_FILENAME = ".vc-config.json";
const VERCEL_FUNCTION_FILE_NAME = "index.js";
const VERCEL_CONFIG_FILE_NAME = "config.json";

/**
 * Write vercel function to disk along with the config file
 * @param apiRoute
 * @param content
 */
async function writeVercelFunctionToDisk(apiRoute: string, content: string) {
  const functionOutputFolder =
    path.resolve(VERCEL_FUNCTIONS_FOLDER, apiRoute) + ".func";

  // check if the folder exists
  if (!existsSync(functionOutputFolder)) {
    await fs.mkdir(functionOutputFolder, { recursive: true });
  }

  const configFilePath = path.join(
    functionOutputFolder,
    VERCEL_FUNCTION_CONFIG_FILENAME,
  );

  await build(content, VERCEL_FUNCTION_FILE_NAME, functionOutputFolder);
  // write config
  await fs.writeFile(
    configFilePath,
    JSON.stringify(
      {
        runtime: "nodejs20.x",
        handler: "index.js",
        launcherType: "Nodejs",
        shouldAddHelpers: true,
      },
      null,
      2,
    ),
  );
}

/**
 * Generate vercel function
 * @param outputDir The generated source code output directory
 * @param route The route information
 * @param type The type of function to generate
 */
async function generateVercelFunction(
  outputDir: string,
  type: "webhook" | "api",
  route?: RouteInfo,
): Promise<string> {
  switch (type) {
    case "webhook":
      return nunjucks.renderString(VERCEL_WEBHOOK_FUNCTION_TEMPLATE, {
        outputDir,
      });
    case "api":
      return nunjucks.renderString(VERCEL_API_ROUTE_TEMPLATE, {
        outputDir,
      });
    default:
      throw new Error(`Unsupported function type: ${type}`);
  }
}

/**
 * Use rspack to build the content
 * @param content
 * @param outputFilename
 * @param outputPath
 */
async function build(
  content: string,
  outputFilename: string,
  outputPath: string,
) {
  const extName = path.extname(outputFilename);
  const baseFileName = path.basename(outputFilename, extName);
  const tempFileName = `${baseFileName}.temp.ts`;
  const tempFilePath = path.join(outputPath, tempFileName);
  await fs.writeFile(tempFilePath, content);

  const compiler = rspack({
    entry: tempFilePath,
    output: {
      filename: outputFilename,
      path: outputPath,
      library: {
        type: "commonjs2",
      },
    },
    target: "node",
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
  });
  try {
    await new Promise<void>((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          reject(err);
          return;
        }
        if (stats?.hasErrors()) {
          const errors = stats.toJson().errors;
          reject(new Error(JSON.stringify(errors, null, 2)));
          return;
        }
        resolve();
      });
    });
    await fs.rm(tempFilePath);
  } catch (e) {
    console.error(e);
    await fs.rm(tempFilePath);
    throw e;
  }
}

async function removeVercelFolder() {
  if (existsSync(VERCEL_OUTPUT_FOLDER)) {
    await fs.rm(VERCEL_OUTPUT_FOLDER, { recursive: true });
  }
}

async function writeVercelConfigFile() {
  const outputDir = path.resolve(VERCEL_OUTPUT_FOLDER, VERCEL_CONFIG_FILE_NAME);
  await fs.writeFile(
    outputDir,
    JSON.stringify({
      version: 3,
    }),
  );
}

export async function buildVercel({ outputFolder }: Options) {
  await removeVercelFolder();
  // create output folder
  await fs.mkdir(VERCEL_OUTPUT_FOLDER, { recursive: true });
  // get route file
  const routeFile = path.resolve(outputFolder, "main.js");
  // node require
  const nativeRequire = require("module").createRequire(process.cwd());
  delete nativeRequire.cache[nativeRequire.resolve(routeFile)];
  // Now import the fresh version
  const { ROUTE_FILE } = nativeRequire(routeFile);

  // build webhook function
  const webhookFunction = await generateVercelFunction(outputFolder, "webhook");
  // write webhook function to disk
  await writeVercelFunctionToDisk("api/webhook", webhookFunction);
  for (const route of ROUTE_FILE.routes) {
    const apiFunctions = await generateVercelFunction(
      outputFolder,
      "api",
      route,
    );
    await writeVercelFunctionToDisk(route.route, apiFunctions);
  }
  await writeVercelConfigFile();
}
