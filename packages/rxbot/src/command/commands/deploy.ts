import { resolve } from "path";
import { DEFAULT_COMPILER_CONFIG_FILE, Logger } from "@rx-lab/common";
import { transformFile } from "@swc/core";
import { z } from "zod";

const schema = z.object({
  webhook: z.object({
    webhookPath: z
      .string({
        description: "Default webhook path. Default set to /api/webhook",
      })
      .optional(),
  }),
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

export default async function runDeploy() {
  // read the config file
  const configFile = await loadConfig(DEFAULT_COMPILER_CONFIG_FILE);
  // check if config match
  const parsedConfig = schema.parse(configFile);
  let webhookPath = "/api/webhook";
  if (parsedConfig.webhook.webhookPath) {
    webhookPath = parsedConfig.webhook.webhookPath;
  }
  Logger.log(
    `Webhook path is set to ${parsedConfig.webhook.webhookPath}`,
    "yellow",
  );
}
