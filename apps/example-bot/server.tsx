import path from "path";
import { Logger } from "@rx-lab/common";
import { Core } from "@rx-lab/core";
import { FileStorage } from "@rx-lab/file-storage";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";
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
  longPolling: true,
});

const client = new FileStorage();

(async () => {
  try {
    const core = await Core.Compile({
      adapter: adapter,
      storage: client,
      rootDir: path.join(__dirname, "src"),
      destinationDir: path.join(__dirname, ".rx-lab"),
    });
    await core.init();
    console.log("Bot is running");
  } catch (err: any) {
    // log error trace
    console.error(err.stack);
    Logger.log(err.toString(), "red");
    process.exit(1);
  }
})();
