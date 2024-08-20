import type { Component } from "@rx-lab/common";
import { CommandButtonCallback } from "./types";

interface EncodeData {
  /**
   * The id of the component.
   */
  id: string;
  type: string;
}

export enum CallbackType {
  onClick = "onClick",
  onCommand = "onCommand",
}

export type DecodeType =
  | [undefined, undefined]
  | [CallbackType.onCommand, CommandButtonCallback]
  | [CallbackType.onClick, EncodeData];

/**
 * CallbackParser is responsible for parsing and encoding the callback data for the telegram bot.
 */
export class CallbackParser {
  encode(element: Component | CommandButtonCallback): string {
    if ("route" in element) {
      return JSON.stringify(element);
    }

    const data: EncodeData = {
      id: element.id,
      type: "onClick",
    };
    return JSON.stringify(data);
  }

  /**
   * Decode the encoded data to the component.
   * Sometimes, the encoded data is not a json, a link or a string, so we need to return it.
   * @param encodedData
   * @param components
   */
  decode(encodedData: string): DecodeType {
    const data = JSON.parse(encodedData);
    if ("route" in data) {
      return [CallbackType.onCommand, data];
    }

    return [CallbackType.onClick, data];
  }

  findComponentByKey(
    key: string,
    components: Component[],
  ): Component | undefined {
    return this.findComponentByKeyHelper(key, components[0], components);
  }

  private findComponentByKeyHelper(
    key: string,
    component: Component | undefined,
    components: Component[],
  ): Component | undefined {
    if (!component) {
      return undefined;
    }

    if (component.id === key) {
      return component;
    }

    // find the component in the children
    for (const child of component.children) {
      const found = this.findComponentByKeyHelper(key, child, components);
      if (found) {
        return found;
      }
    }
  }
}
