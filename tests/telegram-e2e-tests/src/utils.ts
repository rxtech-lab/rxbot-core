import { Compiler, Core } from "@rx-lab/core";
import { Api } from "@rx-lab/mock-telegram-client";
import { Router } from "@rx-lab/router";
import { MemoryStorage } from "@rx-lab/storage/memory";
import {
  type TGContainer,
  TelegramAdapter,
  createTelegramContainer,
} from "@rx-lab/telegram-adapter";

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
  const client = new MemoryStorage();
  const compiler = new Compiler({
    rootDir: opts.rootDir,
    destinationDir: opts.destinationDir,
  });

  const adapter = new TelegramAdapter({
    token: "Some token",
    url: `http://0.0.0.0:${PORT}/webhook/chatroom/${chatroomId}`,
    longPolling: true,
    onMessage: async (message) => {
      const container = createTelegramContainer(message);
      try {
        await core.redirect(container, message, {
          shouldRender: true,
          shouldAddToHistory: true,
        });
      } catch (err) {
        console.error(err);
      }
    },
  });

  const router = new Router({
    adapter: adapter,
    storage: client,
  });
  const core = new Core({
    adapter: adapter,
    storage: client,
    router: router,
  });

  const routeInfo = await compiler.compile();
  await router.initFromRoutes(routeInfo);

  await core.loadAndRenderStoredRoute("/");
  await core.init();

  await api.reset.resetState();

  return { adapter, core, router, compiler, client };
};
