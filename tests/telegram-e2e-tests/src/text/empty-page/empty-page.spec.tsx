import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initialize,
  sleep,
} from "../../utils";

const chatroomId = 1200;

describe("Send render a default page if no page provided", () => {
  let api: Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render default page", async () => {
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core } = await initialize(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "/start",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    let currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("Hello, welcome");

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hi",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(4);
    currentMessage = messages.data.messages[3];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("Hello, welcome");
  });

  afterEach(async () => {
    await coreApi.onDestroy();
  });
});
