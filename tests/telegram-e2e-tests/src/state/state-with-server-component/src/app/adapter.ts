import { Logger } from "@rx-lab/common";
import { MemoryStorage } from "@rx-lab/storage/memory";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";

Logger.shouldLog = true;

const storage = new MemoryStorage();
const adapter = new TelegramAdapter({
  token: "Some token",
  url: `http://0.0.0.0:9000/webhook/chatroom/1000`,
});

export { adapter, storage };
