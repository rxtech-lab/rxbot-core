import { Logger } from "@rx-lab/common";
import { Renderer } from "@rx-lab/core";
import { FileStorage } from "@rx-lab/file-storage";
import { Router } from "@rx-lab/router";
import { type TGContainer, TelegramAdapter } from "@rx-lab/telegram-adapter";
import dotenv from "dotenv";
import Page from "./app/page";

dotenv.config();

const apiKey = process.env.API_KEY ?? process.env.TG_BOT_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing API KEY, please set either API_KEY or TG_BOT_API_KEY in .env file",
  );
}
console.log("Starting bot with key: ", apiKey);

const adapter = new TelegramAdapter({
  token: apiKey,
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

    try {
      const route = await adapter.getCurrentRoute(message);
      if (route) {
        const result = await router.render(route);
        await render.setComponent(result.component as any);
      }
      // render default component
      await render.render(container);
      console.log("Rendered default component");
    } catch (err) {
      console.error(err);
    }
  },
});

const client = new FileStorage();
const render = new Renderer({
  adapter: adapter,
  storage: client,
});
const router = new Router({
  adapter: adapter,
  storage: client,
});

(async () => {
  try {
    const cwd = process.cwd();
    await router.initFromRoutes([
      {
        route: "/",
        filePath: `${cwd}/app/page.tsx`,
        subRoutes: [
          {
            route: "/home",
            filePath: `${cwd}/app/home/page.tsx`,
          },
          {
            route: "/counter",
            filePath: `${cwd}/app/counter/page.tsx`,
          },
        ],
      },
    ]);
    await render.setComponent(<Page />);
    await render.init();
    console.log("Bot is running");
  } catch (err: any) {
    Logger.log(err.toString(), "red");
    process.exit(1);
  }
})();
