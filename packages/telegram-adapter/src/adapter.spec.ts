import { Menu } from "@rx-lab/common";
import * as TelegramBot from "node-telegram-bot-api";
import { TGContainer, TelegramAdapter } from "./adapter";
import { renderElement } from "./renderer";
import { DEFAULT_ROOT_PATH } from "./types";

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
      setMyCommands: jest.fn(),
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
        hasBeenMentioned: false,
        isInGroup: false,
      };

      const result = await adapter.adapt(container as any, false);

      expect(result).toEqual(undefined);
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    it.only("should not send a message if there are no children", async () => {
      const container: TGContainer = {
        type: "ROOT",
        children: [],
        chatroomInfo: { id: 123, messageId: 456, userId: 789 },
        message: {} as any,
        hasUpdated: true,
        hasBeenMentioned: false,
        isInGroup: false,
      };

      const result = await adapter.adapt(container as any, false);

      expect(result).toEqual(undefined);
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
        hasBeenMentioned: false,
        isInGroup: false,
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
        hasBeenMentioned: false,
        isInGroup: false,
      };

      const result = await adapter.adapt(container as any, false);

      expect(result).toEqual([]);
      expect(mockBot.sendMessage).toHaveBeenCalled();
    });
  });

  describe("setMenus", () => {
    it("should convert simple menus to telegram commands", async () => {
      const menus: Menu[] = [
        {
          name: "Settings",
          href: "/settings",
          description: "User settings",
        },
        {
          name: "Profile",
          href: "/profile",
          description: "User profile",
        },
      ];

      await adapter.setMenus(menus);

      expect(mockBot.setMyCommands).toHaveBeenCalledWith([
        {
          command: "/settings",
          description: "User settings",
        },
        {
          command: "/profile",
          description: "User profile",
        },
      ]);
    });

    it("should handle nested menus", async () => {
      const menus: Menu[] = [
        {
          name: "Settings",
          href: "/settings",
          description: "Settings",
          children: [
            {
              name: "Notifications",
              href: "/settings/notifications",
              description: "Notification settings",
            },
            {
              name: "Privacy",
              href: "/settings/privacy",
              description: "Privacy settings",
            },
          ],
        },
      ];

      await adapter.setMenus(menus);

      expect(mockBot.setMyCommands).toHaveBeenCalledWith([
        {
          command: "/settings",
          description: "Settings",
        },
        {
          command: "/settings_notifications",
          description: "Notification settings",
        },
        {
          command: "/settings_privacy",
          description: "Privacy settings",
        },
      ]);
    });

    it("should convert root path to /start command", async () => {
      const menus: Menu[] = [
        {
          name: "Home",
          href: "/",
          description: "Home",
        },
        {
          name: "About",
          href: "/about",
          description: "About",
        },
      ];

      await adapter.setMenus(menus);

      expect(mockBot.setMyCommands).toHaveBeenCalledWith([
        {
          command: "/start",
          description: "Home",
        },
        {
          command: "/about",
          description: "About",
        },
      ]);
    });

    it("should handle menus without descriptions", async () => {
      const menus: Menu[] = [
        {
          name: "Settings",
          href: "/settings",
        },
        {
          name: "Profile",
          href: "/profile",
          description: "User profile",
        },
      ];

      await adapter.setMenus(menus);

      expect(mockBot.setMyCommands).toHaveBeenCalledWith([
        {
          command: "/settings",
          description: "",
        },
        {
          command: "/profile",
          description: "User profile",
        },
      ]);
    });

    it("should handle deeply nested menus", async () => {
      const menus: Menu[] = [
        {
          name: "Settings",
          href: "/settings",
          description: "Settings",
          children: [
            {
              name: "Account",
              href: "/settings/account",
              description: "Account settings",
              children: [
                {
                  href: "/settings/account/password",
                  name: "Password",
                  description: "Password settings",
                },
              ],
            },
          ],
        },
      ];

      await adapter.setMenus(menus);

      expect(mockBot.setMyCommands).toHaveBeenCalledWith([
        {
          command: "/settings",
          description: "Settings",
        },
        {
          command: "/settings_account",
          description: "Account settings",
        },
        {
          command: "/settings_account_password",
          description: "Password settings",
        },
      ]);
    });

    it("should handle empty menu array", async () => {
      await adapter.setMenus([]);

      expect(mockBot.setMyCommands).toHaveBeenCalledWith([]);
    });
  });

  describe("getCurrentRoute", () => {
    let adapter: TelegramAdapter;

    beforeEach(() => {
      adapter = new TelegramAdapter({ token: "fake-token" });
    });

    it("should return undefined for messages without entities", async () => {
      const message = {
        message_id: 1,
        chat: { id: 123 },
        text: "hello world",
      } as TelegramBot.Message;

      const result = await adapter.getCurrentRoute(message);
      expect(result).toBeUndefined();
    });

    it("should return undefined for non-command entities", async () => {
      const message = {
        message_id: 1,
        chat: { id: 123 },
        text: "hello @username",
        entities: [
          {
            type: "mention",
            offset: 6,
            length: 9,
          },
        ],
      } as TelegramBot.Message;

      const result = await adapter.getCurrentRoute(message);
      expect(result).toBeUndefined();
    });

    it("should handle /start command and return root path", async () => {
      const message = {
        message_id: 1,
        chat: { id: 123 },
        text: "/start",
        entities: [
          {
            type: "bot_command",
            offset: 0,
            length: 6,
          },
        ],
      } as TelegramBot.Message;

      const result = await adapter.getCurrentRoute(message);
      expect(result).toEqual({
        route: DEFAULT_ROOT_PATH,
        query: {},
      });
    });

    it("should handle /start command with query parameters", async () => {
      const message = {
        message_id: 1,
        chat: { id: 123 },
        text: "/start param1=value1&param2=value2",
        entities: [
          {
            type: "bot_command",
            offset: 0,
            length: 6,
          },
        ],
      } as TelegramBot.Message;

      const result = await adapter.getCurrentRoute(message);
      expect(result).toEqual({
        route: DEFAULT_ROOT_PATH,
        query: {
          param1: "value1",
          param2: "value2",
        },
      });
    });

    it("should handle other bot commands", async () => {
      const message = {
        message_id: 1,
        chat: { id: 123 },
        text: "/help",
        entities: [
          {
            type: "bot_command",
            offset: 0,
            length: 5,
          },
        ],
      } as TelegramBot.Message;

      const result = await adapter.getCurrentRoute(message);
      expect(result).toEqual({
        route: "/help",
      });
    });

    it("should handle bot commands in group chats with bot mention", async () => {
      const message = {
        message_id: 1,
        chat: { id: 123 },
        text: "/help@mybot",
        entities: [
          {
            type: "bot_command",
            offset: 0,
            length: 11,
          },
        ],
      } as TelegramBot.Message;

      const result = await adapter.getCurrentRoute(message);
      expect(result).toEqual({
        route: "/help",
      });
    });
  });
});
