import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initialize,
  sleep,
} from "../../utils";

const chatroomId = 2000;

describe("Simple server-side redirect Tests", () => {
  let api: Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should redirect in server component", async () => {
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core } = await initialize(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    const currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("This is the home page");
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "redirect",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    // When user navigate to subpage 1, the message count should be 3
    // since renderNewMessage is set to true
    const updatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(updatedMessages.data.count).toBe(4);
    const updatedMessage = updatedMessages.data.messages[3];
    expect(updatedMessage?.update_count).toBe(0);
    expect(updatedMessage?.text).toContain("This is subpage 1");
  });

  it("should redirect in callback in server component", async () => {
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core } = await initialize(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "/redirect-2",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    const currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("This is subpage 1");
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
