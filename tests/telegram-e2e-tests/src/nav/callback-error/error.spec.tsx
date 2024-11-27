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

const chatroomId = 2104;

// related to https://github.com/rxtech-lab/rxbot-core/issues/222
describe("callback error", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render the error page when callback contains error", async () => {
    const { core } = await initialize({
      filename: import.meta.url,
      environment: TestingEnvironment.LongPolling,
      api,
      chatroomId,
    });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    let currentMessage = messages.data.messages[1];
    expect(currentMessage!.text).toContain(
      "This is a page with a callback error.",
    );

    // click the button
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      currentMessage!.message_id,
      {
        text: "Click",
      },
    );

    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(3);
    currentMessage = messages.data.messages[2];
    expect(currentMessage!.text).toContain("500");
    expect(currentMessage!.text).toContain("Custom: This is a custom error.");
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
