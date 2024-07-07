import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import { App } from "./app";
import { Renderer } from "@rx-lab/core";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.API_KEY ?? process.env.TG_BOT_API_KEY;
if(!apiKey) {
  throw new Error("Missing API KEY, please set either API_KEY or TG_BOT_API_KEY in .env file");
}
console.log("Starting bot with key: ", apiKey);
const adapter = new TelegramAdapter({
  token: apiKey,
  longPolling: true,
  onMessage: async (message) => {
    const chatroomId = message?.chat?.id;
    const container = {
      type: "ROOT",
      children: [],
      chatroomId: chatroomId,
      data: message,
    };

    try {
      await render.render(<App />, container);
    } catch (err) {
      console.error(err);
    }
  },
});
const render = new Renderer({
  adapter: adapter,
});

(async () => {
  try {
    await render.init();
    console.log("Bot is running");
  } catch (err) {
    process.exit(1);
  }
})();
