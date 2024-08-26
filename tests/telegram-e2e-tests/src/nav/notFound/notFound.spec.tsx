import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initialize,
  sleep,
} from "../../utils";

const chatroomId = 2100;

describe("404 page", () => {
  let api: Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render the 404 page using the default one", async () => {
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
      content: "/notfound",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    // When user navigate to /notfound,
    // should render the 404 page
    const updatedMessages =
      await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(updatedMessages.data.count).toBe(4);
    const updatedMessage = updatedMessages.data.messages[3];
    expect(updatedMessage?.update_count).toBe(0);
    expect(updatedMessage?.text).toContain("404 - Page Not Found");

    // but once user enter hello, it should go back to the home page
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const homeMessages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(homeMessages.data.count).toBe(6);
    const homeMessage = homeMessages.data.messages[5];
    expect(homeMessage?.update_count).toBe(0);
    expect(homeMessage?.text).toContain("This is the home page");
  });

  it("should render the 404 page using custom one", async () => {
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core } = await initialize(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "/nested/page/not/found",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    const currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("Custom 404 page");
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
