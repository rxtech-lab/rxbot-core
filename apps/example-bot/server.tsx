// Import the framework and instantiate it
import Fastify from "fastify";
import { TelegramAdapter } from "@rx-bot/telegram-adapter";
import React from "react";
import { App } from "./app";
import { Renderer } from "@rx-bot/core";

const endpoint = "https://dev.metopia.co/api/telegram/chat";
const apiKey = process.env.API_KEY!;
const adapter = new TelegramAdapter({
  token: apiKey,
  callbackUrl: endpoint,
});
const render = new Renderer({
  adapter: adapter,
});

const fastify = Fastify({
  logger: true,
});

// Declare a route
fastify.all("/api/telegram/chat", async function handler(request, reply) {
  const data = request.body as any;
  const chatroomId =
    data?.message?.chat?.id ?? data?.callback_query?.message?.chat?.id;

  const container = {
    type: "ROOT",
    children: [],
    chatroomId: chatroomId,
    data: data,
  };

  try {
    await render.render(<App />, container);
    return { hello: "world" };
  } catch (err) {
    console.error(err);
    return { error: err };
  }
});

// Run the server!
(async () => {
  try {
    await render.init();
    await fastify.listen({ port: 8080 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
