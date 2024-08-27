import { InlineKeyboardButton, KeyboardButton } from "node-telegram-bot-api";

export type RenderedElement = {
  text: string;
  reply_markup?: {
    inline_keyboard?: InlineKeyboardButton[][];
    keyboard?: KeyboardButton[][];
    remove_keyboard?: boolean;
  };
};

export const DEFAULT_ROOT_PATH = "/";
/**
 * Start command usually will be the first command that the user will send to the bot.
 * We will treat it as a root path.
 */
export const START_COMMAND = "/start";

export type CommandButtonCallback = {
  route: string;
  new?: boolean;
};
