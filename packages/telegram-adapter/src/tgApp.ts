import { BaseRenderer } from "@rx-bot/core";
import { Container } from "@rx-bot/common";
import TelegramBot, { Update } from "node-telegram-bot-api";
import React from "react";

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
      inline_keyboard: RenderedElement[][];
    }
  | string;

interface TGContainer extends Container {
  chatroomId: number;
  data: Update;
}

const renderElement = (
  element: React.ReactElement & { children?: React.ReactElement[] },
): RenderedElement[] => {
  if (!element) {
    return [""];
  }
  if (element.type === "TEXT_ELEMENT") {
    return element.props.nodeValue;
  }

  let children: RenderedElement[] = [];
  if (element.children) {
    children = element.children.map(renderElement).flat();
  }

  switch (element.type) {
    case "div":
      return children;
    case "h1":
      return [`<b>${children}</b>`];
    case "p":
      return children;
    case "button":
      return [
        {
          text: element.props.children,
          callback_data: element.props.callbackData,
        },
      ];
    case "menu":
      return [
        {
          inline_keyboard: [
            //@ts-expect-error
            element.children.map((child) => renderElement(child)),
          ],
        },
      ];
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
    //@ts-ignore
    const message = renderElement(container.children[0]);
    const chatRoomId = container.chatroomId;

    let textContent = "";
    for (const m of message) {
      if (typeof m === "string") {
        textContent += m;
      }
      if ((m as any).text) {
        textContent += (m as any).text;
      }
    }

    const inline_keyboard = message.find((m) => (m as any).inline_keyboard);
    if (inline_keyboard) {
      await this.bot.sendMessage(chatRoomId, textContent, {
        reply_markup: {
          inline_keyboard: (inline_keyboard as any).inline_keyboard[0],
        },
        parse_mode: "HTML",
      });
    } else {
      await this.bot.sendMessage(chatRoomId, textContent, {
        parse_mode: "HTML",
      });
    }
  }
}
