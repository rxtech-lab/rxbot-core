import { MemoryStorage } from "@rx-lab/storage/memory";
import { TelegramAdapter } from "@rx-lab/telegram-adapter";

const storage = new MemoryStorage();
const adapter = new TelegramAdapter({
  token: "Some token",
  url: `http://0.0.0.0:9000/webhook/chatroom/6100`,
});

export { adapter, storage };
