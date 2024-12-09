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

const chatroomId = 3000;

describe("reload", () => {
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
    it.only(`should reload with new message multiple times in ${environment}`, async () => {
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

      // // click reload with new message
      // await api.chatroom.clickOnMessageInChatroom(
      //   chatroomId,
      //   updatedMessage?.message_id!,
      //   {
      //     text: "Reload with new message",
      //   },
      // );
      // await sleep(DEFAULT_RENDERING_WAIT_TIME);
      // const newReloadedMessages =
      //   await api.chatroom.getMessagesByChatroom(chatroomId);
      // expect(newReloadedMessages.data.count).toBe(3);
      // const doubleUpdatedMessage = newReloadedMessages.data.messages[2];
      // expect(doubleUpdatedMessage?.text).toContain(
      //   "This is the home page with text: Hello",
      // );
      //
      // // click reload with new message
      // await api.chatroom.clickOnMessageInChatroom(
      //   chatroomId,
      //   doubleUpdatedMessage?.message_id!,
      //   {
      //     text: "Reload with new message",
      //   },
      // );
      // await sleep(DEFAULT_RENDERING_WAIT_TIME);
      // const tripleUpdatedMessages =
      //   await api.chatroom.getMessagesByChatroom(chatroomId);
      // expect(tripleUpdatedMessages.data.count).toBe(4);
      // const tripleUpdatedMessage = tripleUpdatedMessages.data.messages;
      // expect(tripleUpdatedMessage[2]!.text).toContain(
      //   "This is the home page with text: Hello",
      // );
    });

    it(`should reload with new message multiple times on different route in ${environment}`, async () => {
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
      let latestMessage = messages.data.messages[1];
      expect(latestMessage?.update_count).toBe(0);
      expect(latestMessage?.text).toContain(
        "This is the home page with text: Hello",
      );

      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        latestMessage?.message_id!,
        {
          text: "Go to sub page",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      latestMessage = messages.data.messages[1];
      expect(messages.data.count).toBe(2);
      expect(latestMessage?.update_count).toBe(1);
      expect(latestMessage?.text).toContain("Hi! How can I help you?");

      // send message to sub page
      await api.chatroom.sendMessageToChatroom(chatroomId, {
        content: "Hello",
        type: MessageType.Text,
      });
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(4);
      latestMessage = messages.data.messages[3];
      expect(latestMessage?.update_count).toBe(0);
      expect(latestMessage?.text).toContain(
        "This is the sub page with text: Hello",
      );

      // click reload with new message
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        latestMessage?.message_id!,
        {
          text: "Reload",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(4);
      latestMessage = messages.data.messages[3];
      expect(latestMessage?.update_count).toBe(1);
      expect(latestMessage?.text).toContain(
        "This is the sub page with text: Hello",
      );

      // click reload with new message
      await api.chatroom.clickOnMessageInChatroom(
        chatroomId,
        latestMessage?.message_id!,
        {
          text: "Reload with new message",
        },
      );
      await sleep(DEFAULT_RENDERING_WAIT_TIME);
      messages = await api.chatroom.getMessagesByChatroom(chatroomId);
      expect(messages.data.count).toBe(5);
      latestMessage = messages.data.messages[4];
      expect(latestMessage?.update_count).toBe(0);
      expect(latestMessage?.text).toContain(
        "This is the sub page with text: Hello",
      );
    });
  }

  afterEach(async () => {
    await coreApi?.onDestroy();
    await cliProcessManager?.stop();
  });
});
