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

const chatroomId = 1300;

//Related to https://github.com/rxtech-lab/rxbot-core/issues/209
describe("Nested text tests", () => {
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
    it(`should be able to handle nested text component ${environment}`, async () => {
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
      expect(currentMessage?.text).toContain("Welcome to the category page");

      // click on the button
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        currentMessage!.message_id!,
        {
          text: "Buy",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(2);
      currentMessage = messages.data.messages[1];
      expect(currentMessage?.update_count).toBe(1);
      expect(currentMessage?.text).toContain("Enter a category id");

      // Second message test
      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "123",
        type: MessageType.Text,
      });
      await sleep(DEFAULT_RENDERING_WAIT_TIME);

      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(4);
      currentMessage = messages.data.messages[3];
      expect(currentMessage?.text).toContain("Enter an item id");

      // Send item id
      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "456",
        type: MessageType.Text,
      });
      await sleep(DEFAULT_RENDERING_WAIT_TIME);

      // should show the item page
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(6);
      currentMessage = messages.data.messages[5];
      expect(currentMessage?.text).toContain("Is bought:No");

      // click on the button Buy
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        currentMessage!.message_id!,
        {
          text: "Buy item",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(6);
      currentMessage = messages.data.messages[5];
      expect(currentMessage?.update_count).toBe(1);
      expect(currentMessage?.text).toContain("Is bought:Yes");
    });
  }

  afterEach(async () => {
    await api.reset.resetChatroomState(chatroomId);
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
