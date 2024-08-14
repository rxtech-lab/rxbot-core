import type { Component } from "@rx-lab/common";
import { CommandButtonCallback } from "./types";

interface EncodeData {
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
  | [CallbackType.onClick, Component];

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
  decode(encodedData: string, components: Component[]): DecodeType {
    if (components.length === 0) {
      throw new Error("No components found");
    }

    const data = JSON.parse(encodedData);
    if ("route" in data) {
      return [CallbackType.onCommand, data];
    }

    const component = this.findComponentByKey(
      data.id,
      components[0],
      components,
    );
    if (!component) {
      return [undefined, undefined];
    }
    return [CallbackType.onClick, component];
  }

  private findComponentByKey(
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
      const found = this.findComponentByKey(key, child, components);
      if (found) {
        return found;
      }
    }
  }
}
