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

const chatroomId = 6100;

/**
 * Test sub functionality. Will prompt a text if user does not provide a text.
 * Will echo the text if user provides a text.
 */
describe("conditional rendering button test", () => {
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
    it(`should be able to click on the button in ${environment}`, async () => {
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
      let firstMessage = messages.data.messages[1];
      expect(firstMessage?.update_count).toBe(0);
      expect(firstMessage?.text).toContain(
        'You need to say "go-to-sub" to go to sub',
      );

      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "go-to-sub",
        type: MessageType.Text,
      });

      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(4);
      firstMessage = messages.data.messages[3];
      expect(firstMessage?.update_count).toBe(0);
      expect(firstMessage?.text).toContain("You just said: go-to-sub");
      // click on the button
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        firstMessage?.message_id!,
        {
          text: "Refresh",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME * 2);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(4);
      firstMessage = messages.data.messages[3];
      expect(firstMessage?.update_count).toBe(1);
      expect(firstMessage?.text).toContain("You just said: go-to-sub");
    });
  }

  afterEach(async () => {
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
