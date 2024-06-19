import { Component } from "@rx-bot/core";
import { Container, InstanceType } from "@rx-bot/common";
import TelegramBot, { Update } from "node-telegram-bot-api";
import { CallbackParser } from "./callbackParser";
import { AdapterInterface } from "@rx-bot/common";

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
    this.bot = new TelegramBot(opts.token);
  }

  async init(): Promise<void> {
    await this.bot.setWebHook(this.opts.callbackUrl);
  }

  async componentOnMount(container: TGContainer): Promise<void> {
    this.bot.on("callback_query", (query) => {
      const data = query.data!;
      const component = this.callbackParser.decode(
        data,
        container.children as any,
      );
      component?.props.onClick?.();
      this.bot.sendMessage(
        query.message!.chat.id,
        `You clicked: ${query.data}`,
      );
    });
  }

  async adapt(container: TGContainer): Promise<RenderedElement[]> {
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
