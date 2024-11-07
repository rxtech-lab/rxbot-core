import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import { FastifyInstance } from "fastify";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initialize,
  initializeWithWebhook,
  sleep,
} from "../../utils";

const chatroomId = 1000;

// render UI with condition
describe("Complex conditional rendering", () => {
  let api: Api<any>;
  let coreApi: any;
  let fastifyServer: FastifyInstance | undefined;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should be able to interact with num pad", async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname);
    const { core } = await initialize(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;

    // first render default page
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    const firstMessage = messages.data.messages[1];
    expect(firstMessage?.update_count).toBe(0);
    expect(firstMessage?.text).toContain("n order to start the bot");
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      firstMessage?.message_id!,
      {
        text: "Start Time: ",
      },
    );
    // When click on the button, it should render the TimeArea component
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const updatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(updatedMessages.data.count).toBe(2);
    const updatedMessage = updatedMessages.data.messages[1];
    expect(updatedMessage?.update_count).toBe(1);
    expect(updatedMessage?.text).toContain(
      "Current start time (24h): ****-**-** **:**",
    );

    // click on the `1` button on the num pad
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      updatedMessage?.message_id!,
      {
        text: "1",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME * 2);
    const doubleUpdatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(doubleUpdatedMessages.data.count).toBe(2);
    const doubleUpdatedMessage = doubleUpdatedMessages.data.messages[1];
    expect(doubleUpdatedMessage?.text).toContain(
      "Current start time (24h): 1***-**-** **:**",
    );
  });

  it("should be able to interact with num pad using webhook", async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core, fastify } = await initializeWithWebhook(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;
    fastifyServer = fastify;

    // first render default page
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    const firstMessage = messages.data.messages[1];
    expect(firstMessage?.update_count).toBe(0);
    expect(firstMessage?.text).toContain("n order to start the bot");
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      firstMessage?.message_id!,
      {
        text: "Start Time: ",
      },
    );
    // When click on the button, it should render the TimeArea component
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const updatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(updatedMessages.data.count).toBe(2);
    const updatedMessage = updatedMessages.data.messages[1];
    expect(updatedMessage?.update_count).toBe(1);
    expect(updatedMessage?.text).toContain(
      "Current start time (24h): ****-**-** **:**",
    );

    // click on the `1` button on the num pad
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      updatedMessage?.message_id!,
      {
        text: "1",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const doubleUpdatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(doubleUpdatedMessages.data.count).toBe(2);
    const doubleUpdatedMessage = doubleUpdatedMessages.data.messages[1];
    expect(doubleUpdatedMessage?.text).toContain(
      "Current start time (24h): 1***-**-** **:**",
    );
  });

  afterEach(async () => {
    await coreApi.onDestroy();
    await fastifyServer?.close();
  });
});
