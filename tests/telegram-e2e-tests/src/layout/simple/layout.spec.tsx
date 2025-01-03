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

const chatroomId = 8000;

describe("Simple Layout Tests", () => {
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
    // TestingEnvironment.DEV,
  ]) {
    it(`should render page with layout in ${environment}`, async () => {
      const { core, processManager } = await initialize({
        filename: import.meta.url,
        environment,
        api,
        chatroomId,
      });
      cliProcessManager = processManager;
      coreApi = core;

      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "Hello",
        type: MessageType.Text,
      });

      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      const firstMessage = messages.data.messages[1];
      expect(firstMessage?.update_count).toBe(0);
      expect(firstMessage?.text).toContain("Home Page");
      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "hi",
        type: MessageType.Text,
      });

      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(4);
      expect(messages.data.messages[3]!.text).toContain("Sub Page");

      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "hi2",
        type: MessageType.Text,
      });

      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(6);
      expect(messages.data.messages[5]!.text).toContain("Sub Page 2");
    });
  }

  afterEach(async () => {
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
