import { spawn } from "child_process";
import path from "path";
import { StorageInterface } from "@rx-lab/common";
import { Compiler, Core } from "@rx-lab/core";
import { Api, MessageType } from "@rx-lab/mock-telegram-client";
import { Router } from "@rx-lab/router";
import { MemoryStorage } from "@rx-lab/storage/memory";
import { type TGContainer, TelegramAdapter } from "@rx-lab/telegram-adapter";

let port = 9000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Simple State Tests", () => {
  let api: Api<any>;
  let adapter: TelegramAdapter;
  let core: Core<any>;
  let router: Router;
  let compiler: Compiler;
  let client: StorageInterface;

  beforeAll(async () => {
    api = new Api({
      baseUrl: `http://0.0.0.0:${port}`,
    });
  });

  const initialize = async (chatroomId: number) => {
    client = new MemoryStorage();
    compiler = new Compiler({
      rootDir: path.join(__dirname, "app"),
      destinationDir: path.join(__dirname, ".rx-lab"),
    });

    adapter = new TelegramAdapter({
      token: "Some token",
      url: `http://0.0.0.0:${port}/webhook/chatroom/${chatroomId}`,
      longPolling: true,
      onMessage: async (message) => {
        const chatroomId = message?.chat?.id;
        const container: TGContainer = {
          type: "ROOT",
          children: [],
          chatroomInfo: {
            id: chatroomId,
            messageId: message?.message_id,
          },
          message: message as any,
        };
        const routeKey = adapter.getRouteKey(container);
        try {
          const routeFromMessage = await adapter.getCurrentRoute(message);
          if (routeFromMessage) {
            await router.navigateTo(routeKey, routeFromMessage);
          }
          await core.loadAndRenderStoredRoute(routeKey);
          // render default component
          await core.render(container);
        } catch (err) {
          console.error(err);
        }
      },
    });

    router = new Router({
      adapter: adapter,
      storage: client,
    });
    core = new Core({
      adapter: adapter,
      storage: client,
      router: router,
    });

    const routeInfo = await compiler.compile();
    await router.initFromRoutes(routeInfo);

    await core.loadAndRenderStoredRoute("/");
    await core.init();

    await api.reset.resetState();
  };

  it("should render the initial state", async () => {
    await initialize(1);
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
  });
});
