import { TelegramAdapter, TGContainer } from "@rx-lab/telegram-adapter";
import { App } from "./app";
import { Renderer } from "@rx-lab/core";
import dotenv from "dotenv";
import { MemoryStorage } from "@rx-lab/storage/memory";

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
      await render.render(container);
    } catch (err) {
      console.error(err);
    }
  },
});

const client = new MemoryStorage({} as any);
const render = new Renderer({
  adapter: adapter,
  storage: client,
});

(async () => {
  try {
    await render.init(<App />);
    console.log("Bot is running");
  } catch (err) {
    process.exit(1);
  }
})();
