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

const chatroomId = 1002;

describe("Simple State with sub components Tests", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render the initial state", async () => {
    const { core, processManager } = await initialize({
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
    const firstMessage = messages.data.messages[1];
    expect(firstMessage?.update_count).toBe(0);
    expect(firstMessage?.text).toContain("Current state: 0");
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      firstMessage?.message_id!,
      {
        text: "+1",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const updatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(updatedMessages.data.count).toBe(2);
    const updatedMessage = updatedMessages.data.messages[1];
    expect(updatedMessage?.update_count).toBe(1);
    expect(updatedMessage?.text).toContain("Current state: 1");

    // click again
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      updatedMessage?.message_id!,
      {
        text: "+1",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const doubleUpdatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(doubleUpdatedMessages.data.count).toBe(2);
    const doubleUpdatedMessage = doubleUpdatedMessages.data.messages[1];
    expect(doubleUpdatedMessage?.text).toContain("Current state: 2");
  });

  afterEach(async () => {
    await coreApi.onDestroy();
  });
});
