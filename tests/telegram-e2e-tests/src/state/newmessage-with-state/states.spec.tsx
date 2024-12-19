import { beforeEach } from "node:test";
import { CLIProcessManager, Telegram, Utils } from "@rx-lab/testing";

const {
  PORT,
  Api,
  initialize,
  TestingEnvironment,
  MessageType,
  DEFAULT_RENDERING_WAIT_TIME,
} = Telegram;
const { sleep } = Utils;

const chatroomId = 1000;

// This test related to https://github.com/rxtech-lab/rxbot-core/issues/274
describe("Should be able to click old message when updating the state", () => {
  let api: Telegram.Api<any>;
  let coreApi: any | undefined;
  let cliProcessManager: CLIProcessManager | undefined;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  beforeEach(() => {
    coreApi = undefined;
    cliProcessManager = undefined;
  });

  for (const environment of [TestingEnvironment.LongPolling]) {
    it(`should render the initial state in ${environment}`, async () => {
      const { core, processManager } = await initialize({
        // @ts-ignore
        filename: import.meta.url,
        environment,
        api,
        chatroomId,
      });
      cliProcessManager = processManager;
      coreApi = core;

      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "/sub",
        type: MessageType.Text,
      });

      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      let lastMessage = messages.data.messages[1];

      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        lastMessage?.message_id!,
        {
          text: "+1",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      lastMessage = messages.data.messages[1];
      expect(lastMessage?.text).toContain("1");

      // click Home
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        lastMessage?.message_id!,
        {
          text: "Home",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(3);

      // click old message
      const oldMessage = messages.data.messages[1];
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        oldMessage?.message_id!,
        {
          text: "+1",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(3);
      const counterMessage = messages.data.messages[1];
      expect(counterMessage?.text).toContain("2");
    });
  }

  afterEach(async () => {
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
