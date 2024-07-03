import {
  AdapterInterface,
  Container,
  InstanceType,
  Component,
} from "@rx-lab/common";
import TelegramBot, { Update } from "node-telegram-bot-api";
import { CallbackParser } from "./callbackParser";

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

type RenderedElement =
  | {
      text: string;
      callback_data: string;
    }
  | {
      inline_keyboard: RenderedElement[][] | RenderedElement[];
    }
  | string;

interface TGContainer extends Container {
  chatroomId: number;
  data: Update;
  messageId?: number;
}

export const renderElement = (
  element: Component,
  parser: CallbackParser,
): RenderedElement | RenderedElement[] => {
  if (!element) {
    return [""];
  }
  if (
    element.type === InstanceType.Text ||
    element.type === InstanceType.LineBreak
  ) {
    return element.props.nodeValue ?? ("" as any);
  }

  let children: RenderedElement[] = [];
  if (element.children) {
    children = element.children.map((e) => renderElement(e, parser)).flat();
  }
  switch (element.type) {
    case InstanceType.Container:
      return children;
    case InstanceType.Header:
      return [`<b>${children}</b>`];
    case InstanceType.Paragraph:
      return children;
    case InstanceType.Button:
      return {
        text: element.props.children,
        callback_data: parser.encode(element),
      };

    case InstanceType.Menu:
      const elements = element.children.map((child) =>
        renderElement(child, parser),
      );
      return {
        inline_keyboard: elements,
      } as RenderedElement;
    default:
      return children;
  }
};

export class TelegramAdapter
  implements AdapterInterface<TGContainer, RenderedElement[] | RenderedElement>
{
  bot: TelegramBot;
  private readonly callbackParser = new CallbackParser();

  constructor(private readonly opts: TelegramAppOpts) {
    const supportLongPolling = "longPolling" in opts ? opts.longPolling : false;
    this.bot = new TelegramBot(opts.token, {
      polling: supportLongPolling,
    });
  }

  async init(): Promise<void> {
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
  }

  async componentOnMount(container: TGContainer): Promise<void> {
    //TODO: should move this callback to init function in the future.
    this.bot.on("callback_query", (query) => {
      const data = query.data!;
      container.messageId = query.message?.message_id;
      const component = this.callbackParser.decode(
        data,
        container.children as any,
      );
      component?.props.onClick?.();
    });
  }

  async adapt(
    container: TGContainer,
    isUpdate: boolean,
  ): Promise<RenderedElement[]> {
    this.bot.processUpdate(container.data);

    if (container.data.callback_query) {
      return [];
    }

    const message = renderElement(
      container.children[0] as any,
      this.callbackParser,
    );
    const chatRoomId = container.chatroomId;

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

    if (isUpdate) {
      await this.bot.editMessageText(textContent, {
        reply_markup: options.reply_markup as any,
        chat_id: chatRoomId,
        message_id: container.messageId,
        ...options,
      });
    } else {
      await this.bot.sendMessage(chatRoomId, textContent, options);
    }

    return message as any;
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
}
