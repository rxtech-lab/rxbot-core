const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

type ColorName = keyof typeof colors;

/**
 * Colorize a string with a given color
 * @param text
 * @param color
 */
function colorize(text: string, color: ColorName): string {
  return `${colors[color]}${text}${colors.reset}`;
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Logger {
  static shouldLog = process.env.NODE_ENV === "development";

  static log(message: string, color?: ColorName) {
    if (Logger.shouldLog) {
      // get caller line number
      const stack = new Error().stack;
      if (stack) {
        const callerLine = stack.split("\n")[2];
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(
          `${colorize(`[${callerLine?.trim()}]`, "yellow")} ${color ? colorize(message, color) : message}`,
        );
      } else {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(message);
      }
    }
  }

  /**
   * Print message to the console with a color. This won't follow the shouldLog flag
   * @param message
   * @param color
   */
  static info(message: string, color?: ColorName) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`${color ? colorize(message, color) : message}`);
  }
}
