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

  decode(encodedData: string, components: Component[]): Component | undefined {
    if (components.length === 0) {
      throw new Error("No components found");
    }
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
