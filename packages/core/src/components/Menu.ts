import { InstanceType } from "@rx-lab/common";
import { BaseComponent } from "./Component";

/**
 * Menu component is used to create a menu in the bot.
 * In telegram, it will be rendered as a list of buttons (InlineKeyboard).
 */
export class Menu extends BaseComponent<any> {
  type = InstanceType.Menu;
}
