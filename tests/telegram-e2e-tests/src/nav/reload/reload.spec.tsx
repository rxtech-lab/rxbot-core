import { beforeEach } from "node:test";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import { CLIProcessManager } from "../../process-manager";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  TestingEnvironment,
  initialize,
  sleep,
} from "../../utils";

const chatroomId = 3000;

describe("reload", () => {
  let api: Api<any>;
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
    it(`should reload in ${environment}`, async () => {
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
      const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      const firstMessage = messages.data.messages[1];
      expect(firstMessage?.update_count).toBe(0);
      expect(firstMessage?.text).toContain(
        "This is the home page with text: Hello",
      );
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        firstMessage?.message_id!,
        {
          text: "Reload",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      const updatedMessages =
        await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(updatedMessages.data.count).toBe(2);
      const updatedMessage = updatedMessages.data.messages[1];
      expect(updatedMessage!.update_count).toBe(1);
      expect(updatedMessage?.text).toContain(
        "This is the home page with text: Hello",
      );

      // click reload with new message
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        updatedMessage?.message_id!,
        {
          text: "Reload with new message",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      const newReloadedMessages =
        await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(newReloadedMessages.data.count).toBe(3);
      const doubleUpdatedMessage = newReloadedMessages.data.messages[2];
      expect(doubleUpdatedMessage?.text).toContain(
        "This is the home page with text: Hello",
      );
    });
  }

  afterEach(async () => {
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
