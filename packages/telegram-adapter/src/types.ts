export type RenderedElement =
  | {
      text: string;
      callback_data: string;
    }
  | {
      inline_keyboard: RenderedElement[][] | RenderedElement[];
    }
  | {
      text: string;
      web_app: {
        url: string;
      };
    }
  | string;

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
