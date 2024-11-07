import { resolve } from "path";
import { DEFAULT_COMPILER_CONFIG_FILE, Logger } from "@rx-lab/common";
import { transformFile } from "@swc/core";
import { z } from "zod";
import deployToVercel from "./deploy-vercel";

const schema = z.object({
  webhook: z.object({}),
});

export type Config = z.infer<typeof schema>;

export async function loadConfig(configPath: string): Promise<Config> {
  const absolutePath = resolve(configPath);

  try {
    const { code } = await transformFile(absolutePath, {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: false,
        },
        target: "es2022",
      },
      module: {
        type: "commonjs",
      },
    });

    const module = { exports: {} };
    const wrapper = Function("module", "exports", code);
    wrapper(module, module.exports);

    //@ts-expect-error
    return module.exports.default as Config;
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
}

interface Options {
  environment: "vercel";
}

export default async function runDeploy({ environment }: Options) {
  // read the config file
  const configFile = await loadConfig(DEFAULT_COMPILER_CONFIG_FILE);
  // check if config match
  schema.parse(configFile);
  Logger.info(`Deploying the app to ${environment}`, "blue");

  switch (environment) {
    case "vercel":
      Logger.info("Deploying to Vercel", "blue");
      await deployToVercel();
      break;
    default:
      throw new Error(`Unsupported environment: ${environment}`);
  }
  Logger.info("Deploy completed successfully", "green");
}
