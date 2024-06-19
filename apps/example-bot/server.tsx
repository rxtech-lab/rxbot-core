// Import the framework and instantiate it
import Fastify from "fastify";
import { TelegramApp } from "@rx-bot/telegram-adapter";
import React from "react";
import { App } from "./app";
import * as fs from "node:fs";

const endpoint = "https://dev.metopia.co/api/telegram/chat";
const apiKey = process.env.API_KEY!;
const app = new TelegramApp({
  token: apiKey,
  callbackUrl: endpoint,
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
  app.render(<App />, container);

  return { hello: "world" };
});

// Run the server!
(async () => {
  try {
    await app.init();
    await fastify.listen({ port: 8080 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
