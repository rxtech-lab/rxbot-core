import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initializeLongPolling,
  sleep,
} from "../../utils";

const chatroomId = 2002;

import { dirname } from "path";
import { fileURLToPath } from "url";

// Related to https://github.com/rxtech-lab/rxbot-core/issues/210
describe("Redirect multiple times", () => {
  let api: Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should redirect", async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname);
    const { core } = await initializeLongPolling(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    let currentMessage = messages.data.messages[1];
    expect(currentMessage!.text).toContain("This is the home page");

    // Click on the button
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      currentMessage!.message_id!,
      {
        text: "Redirect",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME * 2);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    currentMessage = messages.data.messages[3];
    expect(messages.data.count).toBe(4);
    expect(currentMessage!.text).toContain("Page2");

    // send text again
    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    currentMessage = messages.data.messages[5];
    expect(currentMessage!.text).toContain("This is the home page");
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
