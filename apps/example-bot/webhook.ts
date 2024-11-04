import path from "path";
import { Logger } from "@rx-lab/common";
import { Core } from "@rx-lab/core";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import { UpstashStorage } from "@rx-lab/upstash-storage";
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
});

const storage = new UpstashStorage({
  url: process.env.UPSTASH_URL!,
  token: process.env.UPSTASH_TOKEN!,
});

const app = Fastify();
let core: Core<any>;

app.post("/api/webhook", async (req, res) => {
  const { body } = req;
  try {
    const start = Date.now();
    await core.handleMessageUpdate(body as any);
    const end = Date.now();
    Logger.log(`Message handled in ${end - start}ms`);
    return {
      status: "ok",
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
    };
  }
});

app.post(
  "/api/message",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          path: { type: "string" },
          data: { type: "object" },
          to: { type: "string" },
          text: { type: "string" },
        },
        required: ["path", "to", "text"],
      },
    },
  },
  async (req) => {
    const { body } = req;
    try {
      await core.sendMessage(body as any);
    } catch (error) {
      console.error(error);
      return {
        status: "error",
      };
    }
  },
);

(async () => {
  try {
    core = await Core.Compile({
      adapter,
      storage,
      rootDir: path.join(__dirname, "src"),
      destinationDir: path.join(__dirname, ".rx-lab"),
    });
    Logger.log("Bot is running");
    await app.listen({
      port: 3000,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
