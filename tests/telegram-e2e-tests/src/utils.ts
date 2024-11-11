import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Core } from "@rx-lab/core";
import { Api } from "@rx-lab/mock-telegram-client";
import { DelaySimulationFunction, MemoryStorage } from "@rx-lab/storage/memory";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import Fastify from "fastify";
import { build } from "rxbot-cli/command";
import { CLIProcessManager } from "./process-manager";

/**
 * Utility function to sleep for a given time
 * @param ms
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PORT = 9000;

export const DEFAULT_RENDERING_WAIT_TIME = 800;

export const DEFAULT_LONG_RENDERING_WAIT_TIME = 4000;

interface Options {
  rootDir: string;
  destinationDir: string;
  delaySimulation?: DelaySimulationFunction;
}

/**
 * Initialize the core, router, adapter and compiler
 * @param chatroomId
 * @param api
 * @param opts
 */
export const initializeLongPolling = async (
  chatroomId: number,
  api: Api<any>,
  opts: Options,
) => {
  const client = new MemoryStorage(opts.delaySimulation);
  const adapter = new TelegramAdapter({
    token: "Some token",
    url: `http://0.0.0.0:${PORT}/webhook/chatroom/${chatroomId}`,
    longPolling: true,
  });

  await build(opts.rootDir, opts.destinationDir, {
    hasAdapterFile: false,
  });
  const mod = await import(
    path.join(opts.destinationDir, ".rx-lab", "main.js")
  ).then((mod) => mod.default);

  const core = await Core.Start({
    adapter: adapter,
    storage: client,
    routeFile: mod.ROUTE_FILE,
  });

  await api.reset.resetState();

  return { adapter, core, client };
};

export const initializeWithWebhook = async (
  chatroomId: number,
  api: Api<any>,
  opts: Options,
) => {
  const client = new MemoryStorage(opts.delaySimulation);
  const fastify = Fastify();
  const adapter = new TelegramAdapter({
    token: "Some token",
    url: `http://0.0.0.0:${PORT}/webhook/chatroom/${chatroomId}`,
  });
  fastify.post(`/webhook/chatroom/${chatroomId}`, async (req, res) => {
    await adapter.handleMessageUpdate(req.body as any);
    return {
      status: "ok",
    };
  });
  await build(opts.rootDir, opts.destinationDir, {
    hasAdapterFile: false,
  });
  const mod = await import(
    path.join(opts.destinationDir, ".rx-lab", "main.js")
  ).then((mod) => mod.default);

  const core = await Core.Start({
    adapter: adapter,
    storage: client,
    routeFile: mod.ROUTE_FILE,
  });

  await api.reset.resetState();

  await fastify.listen({ port: 10000 });
  await api.chatroom.registerWebhookForChatroom(chatroomId, {
    url: `http://localhost:10000/webhook/chatroom/${chatroomId}`,
  });

  return {
    adapter,
    core,
    client,
    fastify,
  };
};

interface InitializeDevServerOptions {
  cwd: string;
  chatroomId: number;
}

/**
 * Initialize the core, router, adapter and compiler
 * @param api
 * @param opts
 */
export const initializeDevServer = async (
  api: Api<any>,
  opts: InitializeDevServerOptions,
) => {
  const processManager = new CLIProcessManager();
  processManager.on("stderr", (error: any) => {
    if (error.includes("`punycode")) {
      return;
    }
    throw error;
  });
  await processManager.start("rxbot", ["dev"], {
    cwd: opts.cwd,
  });
  await sleep(1000);
  await api.reset.resetState();
  await api.chatroom.registerWebhookForChatroom(opts.chatroomId, {
    url: `http://localhost:3000/api/webhook`,
  });
  return {
    processManager,
  };
};

export enum TestingEnvironment {
  DEV = "dev",
  PROD = "prod",
}

interface InitializeOptions {
  filename: string;
  environment: TestingEnvironment;
  api: Api<any>;
  chatroomId: number;
}

export async function initialize({
  filename,
  environment,
  chatroomId,
  api,
}: InitializeOptions): Promise<{
  adapter?: TelegramAdapter;
  core?: Core<any>;
  client?: MemoryStorage;
  processManager?: CLIProcessManager;
}> {
  const __filename = fileURLToPath(filename);
  const __dirname = dirname(__filename);
  const destinationDir = path.join(__dirname);
  if (environment === TestingEnvironment.PROD) {
    const rootDir = path.join(__dirname, "src");
    return await initializeLongPolling(chatroomId, api, {
      rootDir,
      destinationDir,
    });
  }

  if (environment === TestingEnvironment.DEV) {
    const rootDir = path.resolve(__dirname);
    const { processManager } = await initializeDevServer(api, {
      cwd: rootDir,
      chatroomId,
    });

    return {
      processManager,
    };
  }

  throw new Error("Invalid environment");
}
