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

const chatroomId = 2002;

// Related to https://github.com/rxtech-lab/rxbot-core/issues/210
describe("Redirect multiple times", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should redirect", async () => {
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
    let currentMessage = messages.data.messages[1];
    expect(currentMessage!.text).toContain("This is the home page");

    // Click on the button
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      currentMessage!.message_id!,
      {
        text: "Redirect",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME * 2);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    currentMessage = messages.data.messages[3];
    expect(messages.data.count).toBe(4);
    expect(currentMessage!.text).toContain("Page2");

    // send text again
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    currentMessage = messages.data.messages[5];
    expect(currentMessage!.text).toContain("This is the home page");
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
