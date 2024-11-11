import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initializeLongPolling,
  sleep,
} from "../../utils";

let chatroomId = 1100;

describe("State in multiple routes Tests", () => {
  let api: Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  /**
   * Related to issue https://github.com/rxtech-lab/rxbot-core/issues/66
   */
  it("should be able to update state in other routes", async () => {
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
    expect(messages.data.count).toBe(2);
    let firstMessage = messages.data.messages[1];
    expect(firstMessage?.update_count).toBe(0);
    expect(firstMessage?.text).toContain("Current state: 0");
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      firstMessage!.message_id!,
      {
        text: "+1",
      },
    );
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    firstMessage = messages.data.messages[1];
    expect(firstMessage?.text).toContain("Page 1");
    expect(firstMessage?.text).toContain("Current state: 1");
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      firstMessage!.message_id!,
      {
        text: "Go to page 2",
      },
    );

    // go to page 2
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    const secondMessage = messages.data.messages[2];
    expect(secondMessage?.update_count).toBe(0);
    expect(secondMessage?.text).toContain("Page 2");
    expect(secondMessage?.text).toContain("Current state: 0");

    // click on the button in the first page
    await api.chatroom.clickOnMessageInChatroom(
      chatroomId,
      firstMessage!.message_id!,
      {
        text: "+1",
      },
    );
    //
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    firstMessage = messages.data.messages[1];
    expect(firstMessage?.text).toContain("Page 1");
    expect(firstMessage?.text).toContain("Current state: 1");
  });

  afterEach(async () => {
    await coreApi.onDestroy();
  });
});
