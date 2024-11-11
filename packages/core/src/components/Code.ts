import { InstanceType } from "@rx-lab/common";
import { BaseComponent } from "./Component";

/**
 * Link component is used to render an external link in the bot.
 */
export class Code extends BaseComponent<any> {
  type = InstanceType.Code;
}

export class Pre extends BaseComponent<any> {
  type = InstanceType.Pre;
}
