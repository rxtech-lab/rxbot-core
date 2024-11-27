import { Telegram, Utils } from "@rx-lab/testing";

const {
  PORT,
  Api,
  initialize,
  TestingEnvironment,
  MessageType,
  DEFAULT_RENDERING_WAIT_TIME,
} = Telegram;
const { sleep } = Utils;

const chatroomId = 1200;

describe("Send Start command", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render default page if command is start", async () => {
    const { core } = await initialize({
      filename: import.meta.url,
      environment: TestingEnvironment.LongPolling,
      api,
      chatroomId,
    });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "/start",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    let currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("Hello world");

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hi",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(4);
    currentMessage = messages.data.messages[3];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("Hello world");
  });

  afterEach(async () => {
    await coreApi.onDestroy();
  });
});
