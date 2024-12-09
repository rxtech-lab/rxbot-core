import { beforeEach } from "node:test";
import { Logger } from "@rx-lab/common";
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

// related to https://github.com/rxtech-lab/rxbot-core/issues/240
describe("States within a long run server component", () => {
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

  for (const environment of [TestingEnvironment.DEV]) {
    it(`should render correct state without multiple updates ${environment}`, async () => {
      const { core, processManager } = await initialize({
        filename: import.meta.url,
        environment,
        api,
        chatroomId,
        delaySimulation: () => sleep(Math.floor(Math.random() * 400)) as any,
      });
      cliProcessManager = processManager;
      coreApi = core;

      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "Hello",
        type: MessageType.Text,
      });

      // server component will take 1 second to render
      await sleep(DEFAULT_RENDERING_WAIT_TIME + 1000);
      let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      let firstMessage = messages.data.messages[1];
      expect(firstMessage?.update_count).toBe(0);
      expect(firstMessage?.text).toContain("State 1: 0.1");
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        firstMessage?.message_id!,
        {
          text: "State 1 0.2",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME + 2000);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      firstMessage = messages.data.messages[1];
      expect(firstMessage?.update_count).toBe(1);
      expect(firstMessage?.text).toContain("State 1: 0.2");

      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        firstMessage?.message_id!,
        {
          text: "State 1 0.3",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME + 2000);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      firstMessage = messages.data.messages[1];
      expect(firstMessage?.update_count).toBe(2);
      expect(firstMessage?.text).toContain("State 1: 0.3");
    });
  }

  afterEach(async () => {
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
