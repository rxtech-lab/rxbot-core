import { Telegram, Utils } from "@rx-lab/testing";

const {
  PORT,
  Api,
  initialize,
  TestingEnvironment,
  DEFAULT_RENDERING_WAIT_TIME,
} = Telegram;
const { sleep } = Utils;
const chatroomId = 1200;

describe("Simple send message test", () => {
  let api: Telegram.Api<any>;
  let coreApi: any;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${PORT}`,
    });
  });

  it("should echo user input", async () => {
    const { core } = await initialize({
      filename: import.meta.url,
      environment: TestingEnvironment.LongPolling,
      api,
      chatroomId,
    });
    coreApi = core;

    await core!.sendMessage({
      path: "/",
      text: "Hello world",
      to: `${chatroomId}`,
      data: { foo: "bar" },
      isInGroup: false,
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
