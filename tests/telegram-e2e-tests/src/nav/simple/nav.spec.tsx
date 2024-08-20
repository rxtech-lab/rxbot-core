import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import { PORT, initialize, sleep } from "../../utils";

describe("Simple navigation Tests", () => {
  let api: Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render the nav page", async () => {
    const rootDir = path.join(__dirname, "app");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core } = await initialize(2, api, { rootDir, destinationDir });
    coreApi = core;

    await api.chatroom.sendMessageToChatroom(2, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(500);
    const messages = await api.chatroom.getMessagesByChatroom(2);
    expect(messages.data.count).toBe(2);
    const currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("This is the home page");
    await api.chatroom.clickOnMessageInChatroom(
      2,
      messages.data.messages[1]!.message_id!,
      {
        text: "Go to subpage 1",
      },
    );
    await sleep(500);
    // When user navigate to subpage 1, the message count should be 3
    // since renderNewMessage is set to true
    const updatedMessages = await api.chatroom.getMessagesByChatroom(2);
    expect(updatedMessages.data.count).toBe(3);
    const updatedMessage = updatedMessages.data.messages[2];
    expect(updatedMessage?.update_count).toBe(0);
    expect(updatedMessage?.text).toContain("This is subpage 1");
  });

  afterEach(async () => {
    await coreApi?.onDestroy();
  });
});
