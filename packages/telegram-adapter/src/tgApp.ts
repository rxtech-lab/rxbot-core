import { BaseRenderer, Component } from "@rx-bot/core";
import { Container, InstanceType } from "@rx-bot/common";
import TelegramBot, { Update } from "node-telegram-bot-api";

export interface TelegramAppOpts {
  token: string;
  callbackUrl: string;
}

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
}

const renderElement = (
  element: Component,
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
    children = element.children.map(renderElement).flat();
  }
  switch (element.type) {
    case InstanceType.Container:
      return children;
    case InstanceType.Header:
      return [`<b>${children}</b>`];
    case InstanceType.Paragraph:
      return children;
    case InstanceType.Button:
      return [
        {
          text: element.props.children,
          callback_data: "somedata",
        },
      ];
    case InstanceType.Menu:
      return {
        inline_keyboard: [
          element.children.map((child) => renderElement(child)).flat(),
        ],
      } as RenderedElement;
    default:
      return children;
  }
};

export class TelegramApp extends BaseRenderer<TGContainer> {
  bot: TelegramBot;

  constructor(private readonly opts: TelegramAppOpts) {
    super();
    this.bot = new TelegramBot(opts.token);
  }

  async init(): Promise<void> {
    await this.bot.setWebHook(this.opts.callbackUrl);
    this.bot.on("callback_query", (query) => {
      this.bot.sendMessage(
        query.message!.chat.id,
        `You clicked: ${query.data}`,
      );
    });
  }

  async onRendered(container: TGContainer): Promise<void> {
    this.bot.processUpdate(container.data);

    if (container.data.callback_query) {
      return;
    }

    const message = renderElement(container.children[0] as any);
    const chatRoomId = container.chatroomId;

    const textContent = this.getMessageContent(message);
    const hasInlineKeyboard = this.hasInlineKeyboard(message);
    if (hasInlineKeyboard) {
      const inlineKeyboard = this.getInlineKeyboard(message);
      await this.bot.sendMessage(chatRoomId, textContent, {
        reply_markup: {
          inline_keyboard: inlineKeyboard as any,
        },
        parse_mode: "HTML",
      });
    } else {
      await this.bot.sendMessage(chatRoomId, textContent, {
        parse_mode: "HTML",
      });
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
}
