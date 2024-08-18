import { type Component, InstanceType } from "@rx-lab/common";
import type { CallbackParser } from "./callbackParser";
import type { CommandButtonCallback, RenderedElement } from "./types";
import { convertRouteToTGRoute } from "./utils";

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
    children = element.children.flatMap((e) => renderElement(e, parser));
  }
  switch (element.type) {
    case InstanceType.Command:
      const commandElement = element as any;

      if (commandElement.props.variant === "button") {
        const callbackData: CommandButtonCallback = {
          route: convertRouteToTGRoute(commandElement.props.command),
          new: commandElement.props.renderNewMessage,
        };
        return {
          text: commandElement.props.children,
          callback_data: parser.encode(callbackData),
        };
      }
      return [convertRouteToTGRoute(commandElement.props.command)];
    case InstanceType.Link:
      return [`<a href="${element.props.href}">${children}</a>`];
    case InstanceType.Container:
      return children;
    case InstanceType.Header:
      return [`<b>${children}\n</b>`];
    case InstanceType.Paragraph:
      return children;
    case InstanceType.Button:
      return {
        text: element.props.children,
        callback_data: parser.encode(element),
      };

    case InstanceType.Menu:
      let elements: any[] = element.children.map((child) =>
        renderElement(child, parser),
      );

      // check if elements is an array of arrays
      if (!elements.every(Array.isArray)) {
        elements = [elements];
      }

      return {
        inline_keyboard: elements,
      } as RenderedElement;
    default:
      return children;
  }
};
