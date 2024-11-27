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

const chatroomId = 1200;

describe("Simple Echo Bot Tests", () => {
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

  for (const environment of [
    TestingEnvironment.LongPolling,
    TestingEnvironment.DEV,
  ]) {
    it(`should echo user input in ${environment}`, async () => {
      const { core, processManager } = await initialize({
        filename: import.meta.url,
        environment,
        api,
        chatroomId,
      });
      cliProcessManager = processManager;
      coreApi = core;

      // First message test
      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "Hello",
        type: MessageType.Text,
      });
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      let currentMessage = messages.data.messages[1];
      expect(currentMessage?.update_count).toBe(0);
      expect(currentMessage?.text).toContain("You just said: Hello");

      // Second message test
      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "How are you?",
        type: MessageType.Text,
      });
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(4);
      currentMessage = messages.data.messages[3];
      expect(currentMessage?.update_count).toBe(0);
      expect(currentMessage?.text).toContain("You just said: How are you?");
    });
  }

  afterEach(async () => {
    await api.reset.resetChatroomState(chatroomId);
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
