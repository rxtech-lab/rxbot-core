import path from "path";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import {
  DEFAULT_RENDERING_WAIT_TIME,
  PORT,
  initialize,
  sleep,
} from "../../utils";

const chatroomId = 1200;

describe("Simple send message test", () => {
  let api: Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should echo user input", async () => {
    const rootDir = path.join(__dirname, "src");
    const destinationDir = path.join(__dirname, ".rx-lab");
    const { core } = await initialize(chatroomId, api, {
      rootDir,
      destinationDir,
    });
    coreApi = core;

    await core.sendMessage({
      path: "/",
      text: "Hello world",
      to: `${chatroomId}`,
      data: { foo: "bar" },
    });

    await sleep(DEFAULT_RENDERING_WAIT_TIME);

    const messages = await api.chatroom.getMessagesByChatroom(chatroomId);
    expect(messages.data.messages).toHaveLength(1);

    const message = messages.data.messages[0]!;
    expect(message.text).toContain(
      `You just said: Hello world{\"foo\":\"bar\"}`,
    );
  });

  afterEach(async () => {
    await coreApi.onDestroy();
  });
});
