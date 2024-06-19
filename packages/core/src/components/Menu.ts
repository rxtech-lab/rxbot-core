import { Component } from "./Component";
import { InstanceType } from "@rx-bot/common";

/**
 * Menu component is used to create a menu in the bot.
 * In telegram, it will be rendered as a list of buttons (InlineKeyboard).
 */
export class Menu extends Component {
  type = InstanceType.Menu;
}
