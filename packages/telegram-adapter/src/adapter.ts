import {
  type AdapterInterface,
  type BaseChatroomInfo,
  type Container,
  Logger,
  type Menu,
  type ReconcilerApi,
} from "@rx-lab/common";
import TelegramBot from "node-telegram-bot-api";
import { CallbackParser } from "./callbackParser";
import { renderElement } from "./renderer";
import { DEFAULT_ROOT_PATH, RenderedElement } from "./types";
import { convertRouteToTGRoute, convertTGRouteToRoute } from "./utils";

export type TelegramAppOpts =
  | {
      token: string;
      callbackUrl: string;
    }
  | {
      token: string;
      longPolling: boolean;
      onMessage(message: TelegramBot.Message): Promise<void>;
    };

export interface TGChatroomInfo extends BaseChatroomInfo {}

export interface TGMessage extends TelegramBot.Update {}

export interface TGContainer extends Container<TGChatroomInfo, TGMessage> {}

interface InternalTGContainer extends TGContainer {
  // internal field used to store the message id for updating the message
  updateMessageId?: number;
}

export class TelegramAdapter
  implements
    AdapterInterface<
      TGContainer,
      RenderedElement[] | RenderedElement,
      TelegramBot.Message
    >
{
  bot: TelegramBot;
  private readonly callbackParser = new CallbackParser();

  constructor(private readonly opts: TelegramAppOpts) {
    const supportLongPolling = "longPolling" in opts ? opts.longPolling : false;
    this.bot = new TelegramBot(opts.token, {
      polling: supportLongPolling,
    });
  }

  // TODO: Only works when user send a message to the bot
  //  Need to handle the case that when user click on the button, message is updated
  async init(api: ReconcilerApi<TGContainer>): Promise<void> {
    if ("callbackUrl" in this.opts) {
      if (this.opts.callbackUrl === undefined) {
        throw new Error("callbackUrl is required for webhook mode");
      }
      await this.bot.setWebHook(this.opts.callbackUrl);
    } else {
      this.bot.on("message", (msg) => {
        if ("onMessage" in this.opts) {
          this.opts.onMessage(msg);
        }
      });
    }

    //FIXME: If user click on the button multiple times at the same time,
    // the message only updated once and throw an error
    this.bot.on("callback_query", async (query) => {
      Logger.log("Get callback query", "red");
      const data = query.data!;
      const container: InternalTGContainer = {
        type: "ROOT",
        children: [],
        chatroomInfo: {
          id: query.message?.chat.id as number,
          messageId: query.message?.message_id,
        },
        message: query.message as any,
        hasUpdated: false,
        //@ts-ignore
        id: new Date().getTime(),
      };
      // in order for old message to be updated
      // we need to render the app with the old message
      const updatedContainer = await api.renderApp(
        container,
        async (container: InternalTGContainer) => {
          if (container.hasUpdated || container.hasUpdated === undefined) {
            return;
          }

          if (container.children[0].props.shouldSuspend) {
            return;
          }

          const component = this.callbackParser.decode(
            data,
            container.children as any,
          );
          component?.props.onClick?.();
          container.hasUpdated = true;
          Logger.log("Callback query", "blue");
        },
      );
      (updatedContainer as InternalTGContainer).updateMessageId =
        query.message?.message_id;
    });
  }

  async componentOnMount(container: InternalTGContainer): Promise<void> {}

  async adapt(
    container: InternalTGContainer,
    isUpdate: boolean,
  ): Promise<RenderedElement[]> {
    if (!isUpdate) this.bot.processUpdate(container.message);

    // if hasUpdated is set to false, it means that the message is not updated,
    // so we don't need to send any message
    if (container.hasUpdated !== undefined && !container.hasUpdated) {
      return [];
    }

    // if no children in the container
    // don't send any message
    if (container.children.length === 0) {
      return [];
    }

    if (container.message.callback_query) {
      return [];
    }

    const message = renderElement(
      container.children[0] as any,
      this.callbackParser,
    );
    if (Array.isArray(message) && message.length === 0) {
      return [];
    }

    Logger.log(
      `IsSuspense: ${container.children[0].props.shouldSuspend}`,
      "red",
    );
    const chatRoomId = container.chatroomInfo.id;

    const textContent = this.getMessageContent(message);
    const hasInlineKeyboard = this.hasInlineKeyboard(message);
    let options: TelegramBot.SendMessageOptions = {};
    if (hasInlineKeyboard) {
      const inlineKeyboard = this.getInlineKeyboard(message);
      options = {
        reply_markup: {
          inline_keyboard: inlineKeyboard as any,
        },
        parse_mode: "HTML",
      };
    } else {
      options = {
        parse_mode: "HTML",
      };
    }

    Logger.log(`Sending message`, "blue");
    try {
      if (isUpdate && container.updateMessageId) {
        await this.bot.editMessageText(textContent, {
          ...options,
          reply_markup: options.reply_markup as any,
          chat_id: chatRoomId,
          message_id: container.updateMessageId as number,
        });
      } else {
        await this.bot.sendMessage(chatRoomId, textContent, options);
      }

      return message as any;
    } catch (err: any) {
      Logger.log(`Error sending message: ${err.message}`);
      return [];
    }
  }

  private hasInlineKeyboard(
    message: RenderedElement[] | RenderedElement,
  ): boolean {
    if (Array.isArray(message)) {
      return message.some(this.hasInlineKeyboard);
    }
    return (message as any).inline_keyboard !== undefined;
  }

  private getInlineKeyboard(
    message: RenderedElement[] | RenderedElement,
  ): RenderedElement[] {
    if (Array.isArray(message)) {
      return message.flatMap(this.getInlineKeyboard);
    }
    return (message as any).inline_keyboard ?? [];
  }

  private getMessageContent(
    element: RenderedElement[] | RenderedElement,
  ): string {
    if (Array.isArray(element)) {
      return element.map(this.getMessageContent).join("");
    }

    if (typeof element === "string") {
      return element;
    }
    return (element as any).text ?? "";
  }

  async setMenus(menus: Menu[]): Promise<void> {
    const commands: TelegramBot.BotCommand[] = menus
      .flatMap((menu) => {
        const subCommands = this.getSubCommands(menu);
        return [
          {
            command: convertRouteToTGRoute(menu.href),
            description: menu.description ?? "",
          },
          ...subCommands,
        ];
      })
      .filter((m) => m.command !== DEFAULT_ROOT_PATH);

    await this.bot.setMyCommands(commands);
  }

  private getSubCommands(menu: Menu): TelegramBot.BotCommand[] {
    return (
      menu.children?.flatMap((child) => {
        const subCommands = this.getSubCommands(child);
        return [
          {
            command: convertRouteToTGRoute(child.href),
            description: child.description ?? "",
          },
          ...subCommands,
        ];
      }) ?? []
    );
  }

  async getCurrentRoute(
    message: TelegramBot.Message,
  ): Promise<string | undefined> {
    if (!message.entities) {
      return;
    }

    for (const entity of message.entities) {
      if (entity.type === "bot_command") {
        return message.text?.slice(entity.offset, entity.length);
      }
    }
  }

  parseRoute(route: string): string {
    return convertTGRouteToRoute(route);
  }
}
