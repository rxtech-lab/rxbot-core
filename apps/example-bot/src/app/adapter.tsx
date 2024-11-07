import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import { UpstashStorage } from "@rx-lab/upstash-storage";
import dotenv from "dotenv";

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

export { adapter, storage };
