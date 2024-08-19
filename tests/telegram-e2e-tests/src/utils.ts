import { Compiler, Core } from "@rx-lab/core";
import { Api } from "@rx-lab/mock-telegram-client";
import { Router } from "@rx-lab/router";
import { MemoryStorage } from "@rx-lab/storage/memory";
import { type TGContainer, TelegramAdapter } from "@rx-lab/telegram-adapter";

/**
 * Utility function to sleep for a given time
 * @param ms
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PORT = 9000;

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
      const chatroomId = message?.chat?.id;
      const container: TGContainer = {
        type: "ROOT",
        children: [],
        chatroomInfo: {
          id: chatroomId,
          messageId: message?.message_id,
        },
        message: message as any,
      };
      const routeKey = adapter.getRouteKey(container);
      try {
        const routeFromMessage = await adapter.getCurrentRoute(message);
        if (routeFromMessage) {
          await router.navigateTo(routeKey, routeFromMessage);
        }
        await core.loadAndRenderStoredRoute(routeKey);
        // render default component
        await core.render(container);
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
