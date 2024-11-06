import { Core } from "@rx-lab/core";
import { Api } from "@rx-lab/mock-telegram-client";
import { DelaySimulationFunction, MemoryStorage } from "@rx-lab/storage/memory";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import Fastify from "fastify";

/**
 * Utility function to sleep for a given time
 * @param ms
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PORT = 9000;

export const DEFAULT_RENDERING_WAIT_TIME = 500;

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
export const initialize = async (
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

  const core = await Core.Compile({
    adapter: adapter,
    storage: client,
    rootDir: opts.rootDir,
    destinationDir: opts.destinationDir,
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
  const core = await Core.Compile({
    adapter: adapter,
    storage: client,
    rootDir: opts.rootDir,
    destinationDir: opts.destinationDir,
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