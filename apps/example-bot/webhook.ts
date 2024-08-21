import path from "path";
import { Core } from "@rx-lab/core";
import { FileStorage } from "@rx-lab/file-storage";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import dotenv from "dotenv";
import Fastify from "fastify";

dotenv.config();
const apiKey = process.env.API_KEY ?? process.env.TG_BOT_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing API KEY, please set either API_KEY or TG_BOT_API_KEY in .env file",
  );
}

const adapter = new TelegramAdapter({
  token: apiKey,
  callbackUrl: process.env.CALLBACK_URL!,
});

const storage = new FileStorage();

const app = Fastify();
let core: Core<any>;

app.post("/webhook", async (req, res) => {
  const { body } = req;
  await core.handleMessageUpdate(body as any);
  return {
    status: "ok",
  };
});

(async () => {
  try {
    core = await Core.Compile({
      adapter,
      storage,
      rootDir: path.join(__dirname, "src"),
      destinationDir: path.join(__dirname, ".rx-lab"),
    });
    await core.init();
    console.log("Bot is running");
    await app.listen({
      port: 3000,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
