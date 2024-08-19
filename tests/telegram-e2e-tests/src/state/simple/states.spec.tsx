import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import { PORT, initialize, sleep } from "../../utils";

describe("Simple State Tests", () => {
  let api: Api<any>;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should render the initial state", async () => {
    const rootDir = path.join(__dirname, "app");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core } = await initialize(1, api, {
      rootDir,
      destinationDir,
    });

    await api.chatroom.sendMessageToChatroom(1, {
      content: "Hello",
      type: MessageType.Text,
    });

    await sleep(3000);
    const messages = await api.chatroom.getMessagesByChatroom(1);
    expect(messages.data.count).toBe(2);
    const currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("Current state: 0");
    await api.chatroom.clickOnMessageInChatroom(
      1,
      messages.data.messages[1]!.message_id!,
      {
        text: "+1",
      },
    );
    await sleep(5000);
    const updatedMessages = await api.chatroom.getMessagesByChatroom(1);
    expect(updatedMessages.data.count).toBe(2);
    const updatedMessage = updatedMessages.data.messages[1];
    expect(updatedMessage?.update_count).toBe(1);
    expect(updatedMessage?.text).toContain("Current state: 1");

    await core.onDestroy();
  });
});
