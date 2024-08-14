import type { Component } from "@rx-lab/common";

interface EncodeData {
  id: string;
  type: string;
}

/**
 * CallbackParser is responsible for parsing and encoding the callback data for the telegram bot.
 */
export class CallbackParser {
  encode(element: Component): string {
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
  decode(
    encodedData: string,
    components: Component[],
  ): Component | string | undefined {
    if (components.length === 0) {
      throw new Error("No components found");
    }
    try {
      const data = JSON.parse(encodedData) as EncodeData;
      const component = this.findComponentByKey(
        data.id,
        components[0],
        components,
      );
      if (!component) {
        return undefined;
      }
      return component;
    } catch (e: any) {
      // catch SyntaxError: Unexpected token '/', "/home" is not valid JSON
      if ("is not valid JSON" in e) {
        return encodedData;
      }
    }
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
