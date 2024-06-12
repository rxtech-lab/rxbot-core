// Import the framework and instantiate it
import Fastify from "fastify";
import { TelegramApp } from "@rx-bot/telegram-adapter";

const endpoint = "https://dev.metopia.co/api/telegram/chat";
const apiKey = process.env.API_KEY!;
const app = new TelegramApp({
  token: apiKey,
  callbackUrl: endpoint,
});

const fastify = Fastify({
  logger: true,
});

const App = () => (
  <div>
    <h1>Welcome to the Telegram Bot!</h1>
    <p>Choose an option:</p>
    <menu>
      {/* @ts-ignore */}
      <button callbackData="option1">Option 1</button>
      {/* @ts-ignore */}
      <button callbackData="option2">Option 2</button>
    </menu>
  </div>
);

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
