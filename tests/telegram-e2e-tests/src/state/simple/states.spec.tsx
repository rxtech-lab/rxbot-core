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

const chatroomId = 1000;

describe("Simple State Tests", () => {
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
    TestingEnvironment.DEV,
  ]) {
    it(`should render the initial state in ${environment}`, async () => {
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
  }

  afterEach(async () => {
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
