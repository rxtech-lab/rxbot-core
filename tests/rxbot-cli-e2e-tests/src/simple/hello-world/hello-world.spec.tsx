import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import { CLIProcessManager } from "../../process-manager";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initializeDevServer,
  sleep,
} from "../../utils";

const chatroomId = 4000;

describe("Simple hello world", () => {
  let api: Api<any>;
  let cliProcessManager: CLIProcessManager;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should show a simple hello world", async () => {
    const rootDir = path.resolve(__dirname);
    const { processManager } = await initializeDevServer(api, {
      cwd: rootDir,
      chatroomId,
    });
    cliProcessManager = processManager;

    await api.chatroom.sendMessageToChatroom(chatroomId, {
      content: "Hello",
      type: MessageType.Text,
    });
    await sleep(DEFAULT_RENDERING_WAIT_TIME);
    let messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.count).toBe(2);
    let currentMessage = messages.data.messages[1];
    expect(currentMessage?.update_count).toBe(0);
    expect(currentMessage?.text).toContain("Hello world");
  });

  afterEach(async () => {
    await cliProcessManager.stop();
  });
});
