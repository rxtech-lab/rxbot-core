import { Component, InstanceType } from "@rx-lab/common";
import { InlineKeyboardButton } from "node-telegram-bot-api";
import { CallbackParser } from "./callbackParser";
import { RenderedElement } from "./types";
import { convertRouteToTGRoute } from "./utils";

export const renderElementHelper = (
  element: Component,
  parser: CallbackParser,
): any => {
  if (!element) {
    return [""];
  }

  if (element.type === InstanceType.Text) {
    return element.props.nodeValue ?? ("" as any);
  }

  if (element.type === InstanceType.LineBreak) {
    return "\n";
  }

  let children: any[] = [];
  if (element.children) {
    children = element.children.flatMap((e) => renderElementHelper(e, parser));
  }

  switch (element.type) {
    case InstanceType.Container:
      return {
        type: "container",
        children: children,
      };

    case InstanceType.Button:
      return {
        type: "button",
        text: children.join(""),
        callback_data: parser.encode(element),
      };

    case InstanceType.Link:
      return [`<a href="${element.props.href}">${children.join("")}</a>`];
    case InstanceType.BoldText:
      return [`<b>${children.join("")}</b>`];
    case InstanceType.ItalicText:
      return [`<i>${children.join("")}</i>`];
    case InstanceType.Pre:
      return [`<pre>${children.join("")}</pre>`];
    case InstanceType.Code:
      return [`<code>${children.join("")}</code>`];
    case InstanceType.Command:
      if (element.props.variant === "button") {
        if (element.props.command.startsWith("http")) {
          return {
            type: "button",
            text: children.join(""),
            web_app: {
              url: element.props.command,
            },
          };
        }
        const callbackData = {
          route: convertRouteToTGRoute(element.props.command),
          new: element.props.renderNewMessage,
        };
        return {
          type: "button",
          text: children.join(""),
          callback_data: parser.encode(callbackData),
        };
      }
      return [convertRouteToTGRoute(element.props.command)];

    case InstanceType.Paragraph:
      // need to add a space between newline characters
      // otherwise, telegram will not render the new line
      return [...children, "\n \n"];
    case InstanceType.InlineParagraph:
      return children;
    case InstanceType.Header:
      return [`<b>${children.join("")}</b>`, "\n \n"];

    case InstanceType.List:
      return element.children.map(
        (item, index) => `${index + 1}. ${renderElementHelper(item, parser)}\n`,
      );

    case InstanceType.Menu: {
      const buttons = element.children
        .filter((child) => child.type === InstanceType.Container)
        .map((container) => renderElementHelper(container, parser));
      return {
        keyboard: buttons,
      };
    }

    case InstanceType.Audio:
      return {
        type: "audio",
        audio: element.props.src,
        caption: element.props.caption,
      };

    case InstanceType.Video:
      return {
        type: "video",
        video: element.props.src,
        caption: element.props.caption,
      };

    case InstanceType.Image:
      return {
        type: "photo",
        photo: element.props.src,
        caption: element.props.caption,
      };

    default:
      return children;
  }
};

export const renderElement = (
  element: Component,
  parser: CallbackParser,
): RenderedElement => {
  const result = renderElementHelper(element, parser);

  const finalResult: RenderedElement = { text: "" };
  const inlineKeyboardButtons: InlineKeyboardButton[][] = [];

  const processResult = (res: any, level = 0) => {
    if (Array.isArray(res)) {
      // biome-ignore lint/complexity/noForEach: <explanation>
      res.forEach((item) => processResult(item, level));
      return;
    }

    if (typeof res === "string") {
      finalResult.text += res;
      return;
    }

    if (res.type === "container") {
      if (level === 0) {
        // biome-ignore lint/complexity/noForEach: <explanation>
        res.children.forEach((child: any) => processResult(child, level + 1));
      } else {
        const row: InlineKeyboardButton[] = [];
        // biome-ignore lint/complexity/noForEach: <explanation>
        res.children.forEach((child: any) => {
          if (child.type === "button") {
            row.push({
              text: child.text,
              callback_data: child.callback_data,
              web_app: child.web_app,
            });
          } else {
            processResult(child, level + 1);
          }
        });
        if (row.length > 0) {
          inlineKeyboardButtons.push(row);
        }
      }
    } else if (res.type === "button") {
      const button: InlineKeyboardButton = {
        text: res.text,
        callback_data: res.callback_data,
      };
      if (res.web_app) {
        button.web_app = res.web_app;
      }

      if (level === 1) {
        inlineKeyboardButtons.push([button]);
      } else {
        if (inlineKeyboardButtons.length === 0 || level === 0) {
          inlineKeyboardButtons.push([button]);
        } else {
          inlineKeyboardButtons[inlineKeyboardButtons.length - 1].push(button);
        }
      }
    } else if (
      res.type === InstanceType.Text ||
      res.type === InstanceType.LineBreak
    ) {
      finalResult.text += res.props.nodeValue || "";
    }

    if (res.keyboard) {
      finalResult.reply_markup = finalResult.reply_markup || {};
      finalResult.reply_markup.keyboard = res.keyboard.map((row: any) => {
        if (Array.isArray(row.children)) {
          return row.children.map((button: any) => ({
            text: button.text,
            callback_data: button.callback_data,
            web_app: button.web_app,
          }));
        }
        return [];
      });
    }

    if (
      res.type &&
      (res.type === "audio" || res.type === "video" || res.type === "photo")
    ) {
      Object.assign(finalResult, res);
    }
  };

  processResult(result);

  if (inlineKeyboardButtons.length > 0) {
    finalResult.reply_markup = finalResult.reply_markup || {};
    finalResult.reply_markup.inline_keyboard = inlineKeyboardButtons;
  }

  return finalResult;
};
