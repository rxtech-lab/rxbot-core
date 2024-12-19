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

describe("error page with redirect", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render the error page using the default one", async () => {
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
    expect(currentMessage!.text).toContain("Home");

    // click on the error button
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      currentMessage!.message_id,
      {
        text: "Go to error",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    currentMessage = messages.data.messages[1];
    expect(currentMessage!.text).toContain("Enter something");

    // enter a text
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "error",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    currentMessage = messages.data.messages[3];
    expect(currentMessage!.text).toContain("500");

    // enter a text again
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "hi",
      type: MessageType.Text,
    });

    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    currentMessage = messages.data.messages[5];
    expect(currentMessage!.text).toContain("Home");
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
