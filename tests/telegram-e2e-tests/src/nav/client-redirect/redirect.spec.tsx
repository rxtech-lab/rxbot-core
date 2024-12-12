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

describe("Simple client-side redirect Tests", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should redirect", async () => {
    const chatroomId = 2001;
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
    const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    const currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("This is the home page");
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      currentMessage!.message_id!,
      {
        text: "Redirect",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    // When user navigate to subpage 1, the message count should be 3
    // since renderNewMessage is set to true
    const updatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(updatedMessages.data.count).toBe(3);
    const updatedMessage = updatedMessages.data.messages[2];
    expect(updatedMessage?.update_count).toBe(0);
    const userId = updatedMessages.data.messages[0]!.user_id;
    expect(updatedMessage?.text).toContain(
      `This is subpage 1 with userId ${userId}`,
    );
  });

  it("should redirect without rendering new page", async () => {
    const chatroomId = 2002;
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
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("This is the home page");
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      currentMessage!.message_id!,
      {
        text: "Redirect without rendering",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    // When user navigate to subpage 1, the message count should be 3
    // since renderNewMessage is set to true
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(4);
    currentMessage = messages.data.messages[3];
    expect(currentMessage!.text).toContain(
      `This is subpage 1 with userId ${messages.data.messages[0]!.user_id}`,
    );
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
