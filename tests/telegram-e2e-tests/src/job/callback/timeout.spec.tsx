import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Telegram, Utils } from "@rx-lab/testing";
import { initializeWithWebhook } from "@rx-lab/testing/dist/telegram";
import { FastifyInstance } from "fastify";

const { PORT, Api, MessageType, DEFAULT_RENDERING_WAIT_TIME } = Telegram;
const { sleep } = Utils;

const chatroomId = 2104;

// related to https://github.com/rxtech-lab/rxbot-core/issues/223
describe("timeout", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;
  let fastifyServer: FastifyInstance;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should not timeout when a long running job in callback during rendering", async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname, ".rx-lab");
    let hasClicked = false;
    let hasFinished = false;
    const { core, fastify } = await initializeWithWebhook(chatroomId, api, {
      destinationDir: destinationDir,
      rootDir: rootDir,
      onHttpReturn: async () => {
        if (!hasClicked) {
          return;
        }
        await sleep(DEFAULT_RENDERING_WAIT_TIME * 10);
        messages = await api.chatroom.getMessagesByChatroom(chatroomId);
        expect(messages.data.count).toBe(3);
        currentMessage = messages.data.messages[2];
        expect(currentMessage!.text).toContain("Finish");
        hasFinished = true;
      },
    });
    coreApi = core;
    fastifyServer = fastify;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    let currentMessage = messages.data.messages[1];
    expect(currentMessage!.text).toContain("This is a page");

    // click the button
    hasClicked = true;
    api.chatroom
      .clickOnMessageInChatroom(chatroomId, currentMessage!.message_id, {
        text: "Click",
      })
      .then(() => {});

    await sleep(7_000 + 4 * DEFAULT_RENDERING_WAIT_TIME);
    expect(hasFinished).toBeTruthy();
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
    await fastifyServer.close();
  });
});
