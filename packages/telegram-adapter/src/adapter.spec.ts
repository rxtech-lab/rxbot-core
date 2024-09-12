import * as TelegramBot from "node-telegram-bot-api";
import { TGContainer, TelegramAdapter } from "./adapter";
import { renderElement } from "./renderer";

jest.mock("node-telegram-bot-api");
jest.mock("./callbackParser");
jest.mock("./renderer");

describe("TelegramAdapter", () => {
  let adapter: TelegramAdapter;
  let mockBot: jest.Mocked<TelegramBot>;

  beforeEach(() => {
    mockBot = {
      processUpdate: jest.fn(),
      sendMessage: jest.fn(),
      editMessageText: jest.fn(),
    } as any as jest.Mocked<TelegramBot>;
    adapter = new TelegramAdapter({ token: "mock-token" });
    adapter["bot"] = mockBot;
  });

  describe("adapt", () => {
    it("should not send a message if hasUpdated is false", async () => {
      const container: TGContainer = {
        type: "ROOT",
        children: [],
        chatroomInfo: { id: 123, messageId: 456, userId: 789 },
        message: {} as any,
        hasUpdated: false,
      };

      const result = await adapter.adapt(container as any, false);

      expect(result).toEqual([]);
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    it("should not send a message if there are no children", async () => {
      const container: TGContainer = {
        type: "ROOT",
        children: [],
        chatroomInfo: { id: 123, messageId: 456, userId: 789 },
        message: {} as any,
        hasUpdated: true,
      };

      const result = await adapter.adapt(container as any, false);

      expect(result).toEqual([]);
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    it("should send a new message if not updating", async () => {
      const mockRenderedElement = { text: "Hello", reply_markup: {} };
      (renderElement as jest.Mock).mockReturnValue(mockRenderedElement);

      const container: TGContainer = {
        type: "ROOT",
        children: [{ props: { shouldSuspend: false } }],
        chatroomInfo: { id: 123, messageId: 456, userId: 789 },
        message: {} as any,
        hasUpdated: true,
      };

      await adapter.adapt(container as any, false);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        "Hello",
        expect.objectContaining({
          reply_markup: {},
          parse_mode: "HTML",
        }),
      );
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    it("should update an existing message if updating", async () => {
      const mockRenderedElement = { text: "Updated", reply_markup: {} };
      (renderElement as jest.Mock).mockReturnValue(mockRenderedElement);

      const container: TGContainer = {
        type: "ROOT",
        children: [{ props: { shouldSuspend: false } }],
        chatroomInfo: { id: 123, messageId: 456, userId: 789 },
        message: {} as any,
        hasUpdated: true,
        // @ts-ignore
        updateMessageId: 789,
      };

      await adapter.adapt(container as any, true);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        "Updated",
        expect.objectContaining({
          chat_id: 123,
          message_id: 789,
          reply_markup: {},
          parse_mode: "HTML",
        }),
      );
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
    });

    it("should handle errors when sending messages", async () => {
      const mockRenderedElement = { text: "Error test", reply_markup: {} };
      (renderElement as jest.Mock).mockReturnValue(mockRenderedElement);
      mockBot.sendMessage.mockRejectedValue(new Error("Send error"));

      const container: TGContainer = {
        type: "ROOT",
        children: [{ props: { shouldSuspend: false } }],
        chatroomInfo: { id: 123, messageId: 456, userId: 789 },
        message: {} as any,
        hasUpdated: true,
      };

      const result = await adapter.adapt(container as any, false);

      expect(result).toEqual([]);
      expect(mockBot.sendMessage).toHaveBeenCalled();
    });
  });
});
