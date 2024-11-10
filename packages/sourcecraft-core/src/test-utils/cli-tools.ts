import { ChildProcess, spawn } from "child_process";
import * as path from "node:path";

export interface CliOptions {
  /** Base command to run (e.g., 'node', 'python') */
  command?: string;
  /** Command arguments */
  args?: string[];
  /** Time to wait for output (ms) */
  defaultTimeout?: number;
  /** Delay between keystrokes (ms) */
  typeDelay?: number;
  currentDir?: string;
}

export interface TypeOptions {
  /** Delay between keystrokes in ms */
  delay?: number;
  /** Whether to press Enter after typing */
  pressEnter?: boolean;
}

export class CliInteraction {
  private static readonly SPECIAL_KEYS = {
    ENTER: "\r",
    SPACE: " ",
    UP: "\x1B\x5B\x41",
    DOWN: "\x1B\x5B\x42",
    RIGHT: "\x1B\x5B\x43",
    LEFT: "\x1B\x5B\x44",
    CTRL_C: "\x03",
    BACKSPACE: "\x7F",
    TAB: "\t",
    DELETE: "\x1B\x5B\x33\x7E",
    HOME: "\x1B\x5B\x48",
    END: "\x1B\x5B\x46",
  } as const;

  private process: ChildProcess;
  private stdout = "";
  private stderr = "";
  private readonly defaultTimeout: number;
  private readonly typeDelay: number;
  private currentDir: string;

  constructor(options: CliOptions = {}) {
    const {
      command = "node",
      args = [],
      defaultTimeout = 5000,
      typeDelay = 50,
    } = options;

    this.defaultTimeout = defaultTimeout;
    this.typeDelay = typeDelay;
    this.currentDir = path.resolve(options.currentDir || process.cwd());
    this.process = this.createProcess(command, args);
    this.setupProcessListeners();
  }

  /**
   * Creates a new child process
   */
  private createProcess(command: string, args: string[]): ChildProcess {
    return spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: this.currentDir,
      env: {
        ...process.env,
        PWD: this.currentDir,
      },
    });
  }

  /**
   * Sets up process output listeners
   */
  private setupProcessListeners(): void {
    this.process.stdout?.on("data", (data: Buffer) => {
      console.debug(data.toString());
      this.stdout += data.toString();
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      this.stderr += data.toString();
    });

    this.process.on("error", (error: Error) => {
      throw new Error(`Process error: ${error.message}`);
    });
  }

  /**
   * Writes raw input to the process
   */
  public write(input: string): void {
    if (!this.process.stdin?.writable) {
      throw new Error("Process stdin is not writable");
    }
    this.process.stdin.write(input);
  }

  /**
   * Gets the current working directory
   */
  public getCurrentDirectory(): string {
    return this.currentDir;
  }

  /**
   * Sends a special key command
   */
  public sendKey(key: keyof typeof CliInteraction.SPECIAL_KEYS): void {
    const keyCode = CliInteraction.SPECIAL_KEYS[key];
    if (!keyCode) {
      throw new Error(`Unknown special key: ${key}`);
    }
    this.write(keyCode);
  }

  /**
   * Types text with optional delay between characters
   */
  public async type(text: string, options: TypeOptions = {}): Promise<void> {
    const { delay = this.typeDelay, pressEnter = false } = options;

    for (const char of text) {
      this.write(char);
      await this.delay(delay);
    }

    if (pressEnter) {
      this.sendKey("ENTER");
    }
  }

  /**
   * Waits for specific output pattern
   */
  public async waitForOutput(
    matcher: RegExp | string,
    timeout: number = this.defaultTimeout,
  ): Promise<string> {
    const pattern = typeof matcher === "string" ? new RegExp(matcher) : matcher;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (pattern.test(this.stdout)) {
        return this.stdout;
      }
      await this.delay(100);
    }

    throw new Error(
      `Timeout waiting for output matching ${pattern}. Current output: ${this.stdout}`,
    );
  }

  /**
   * Executes a sequence of CLI interactions
   */
  public async executeSequence(
    steps: Array<{
      expect: RegExp | string;
      input?: string;
      key?: keyof typeof CliInteraction.SPECIAL_KEYS;
    }>,
  ): Promise<void> {
    for (const step of steps) {
      await this.waitForOutput(step.expect);

      if (step.input) {
        await this.type(step.input, { pressEnter: true });
      }

      if (step.key) {
        this.sendKey(step.key);
      }
    }
  }

  /**
   * Gets current stdout content
   */
  public getOutput(): string {
    return this.stdout;
  }

  /**
   * Gets current stderr content
   */
  public getError(): string {
    return this.stderr;
  }

  /**
   * Cleans up the process
   */
  public cleanup(): void {
    if (this.process.stdin?.writable) {
      this.process.stdin.end();
    }
    this.process.kill();
  }

  /**
   * Utility method for creating delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
