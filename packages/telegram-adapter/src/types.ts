export type RenderedElement =
  | {
      text: string;
      callback_data: string;
    }
  | {
      inline_keyboard: RenderedElement[][] | RenderedElement[];
    }
  | string;

export const DEFAULT_ROOT_PATH = "/";

export type CommandButtonCallback = {
  route: string;
  new?: boolean;
};
