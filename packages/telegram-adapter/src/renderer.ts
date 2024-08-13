import { type Component, InstanceType } from "@rx-lab/common";
import type { CallbackParser } from "./callbackParser";
import type { RenderedElement } from "./types";

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
