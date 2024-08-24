import path from "path";
import { Logger } from "@rx-lab/common";
import { Core } from "@rx-lab/core";
import { FileStorage } from "@rx-lab/file-storage";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";

const adapter = new TelegramAdapter({
  token: process.env.API_KEY ?? process.env.TG_BOT_API_KEY!,
  longPolling: true,
});

const storage = new FileStorage();

(async () => {
  try {
    Logger.log("Bot is starting");
    await Core.Compile({
      rootDir: path.join(__dirname, "src"),
      destinationDir: path.join(__dirname, ".rx-lab"),
      adapter,
      storage,
    });
    Logger.log("Bot is running");
  } catch (err: any) {
    // log error trace
    console.error(err.stack);
    Logger.log(err.toString(), "red");
    process.exit(1);
  }
})();
