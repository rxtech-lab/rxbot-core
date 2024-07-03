import { TelegramAdapter } from "@rx-lab/telegram-adapter";
import React from "react";
import { App } from "./app";
import { Renderer } from "@rx-lab/core";

const apiKey = process.env.API_KEY!;
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
