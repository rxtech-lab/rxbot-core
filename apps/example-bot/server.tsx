import path from "path";
import { Logger } from "@rx-lab/common";
import { Compiler, Core } from "@rx-lab/core";
import { FileStorage } from "@rx-lab/file-storage";
import { Router } from "@rx-lab/router";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import { createTelegramContainer } from "@rx-lab/telegram-adapter";
import dotenv from "dotenv";

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

const client = new FileStorage();
const router = new Router({
  adapter: adapter,
  storage: client,
});
const core = new Core({
  adapter: adapter,
  storage: client,
  router: router,
});

const compiler = new Compiler({
  rootDir: path.join(__dirname, "app"),
  destinationDir: path.join(__dirname, ".rx-lab"),
});

(async () => {
  try {
    const routeInfo = await compiler.compile();
    await router.initFromRoutes(routeInfo);

    await core.loadAndRenderStoredRoute("/");
    await core.init();
    console.log("Bot is running");
  } catch (err: any) {
    // log error trace
    console.error(err.stack);
    Logger.log(err.toString(), "red");
    process.exit(1);
  }
})();
