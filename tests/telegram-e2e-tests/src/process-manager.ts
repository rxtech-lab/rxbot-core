// types.ts
export interface ProcessInfo {
  command: string;
  args: string[];
  pid: number;
  startTime: Date;
}

export interface ProcessStatus {
  running: boolean;
  process: ProcessInfo | null;
}

export interface ProcessOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  shell?: boolean;
}

// cliProcessManager.ts
import { ChildProcess, spawn } from "child_process";
import { EventEmitter } from "events";

export class CLIProcessManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private isRunning = false;
  private processInfo: ProcessInfo | null = null;

  public async start(
    command: string,
    args: string[] = [],
    options: ProcessOptions = {},
  ): Promise<ProcessInfo> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        reject(new Error("Process is already running"));
        return;
      }

      try {
        // Spawn the process
        this.process = spawn(command, args, {
          stdio: ["ignore", "pipe", "pipe"],
          detached: true,
          ...options,
        });

        if (!this.process.pid) {
          throw new Error("Failed to get process PID");
        }

        this.processInfo = {
          command,
          args,
          pid: this.process.pid,
          startTime: new Date(),
        };

        // Handle stdout
        this.process.stdout?.on("data", (data: Buffer) => {
          const output = data.toString();
          this.emit("stdout", output);
        });

        // Handle stderr
        this.process.stderr?.on("data", (data: Buffer) => {
          const error = data.toString();
          this.emit("stderr", error);
          console.error(`[Process Error]: ${error}`);
        });

        // Handle process errors
        this.process.on("error", (error: Error) => {
          console.error("[Process Error]:", error);
          this.emit("error", error);
          this.cleanup();
          reject(error);
        });

        // Handle process exit
        this.process.on(
          "exit",
          (code: number | null, signal: NodeJS.Signals | null) => {
            const exitInfo = { code, signal };
            this.emit("exit", exitInfo);

            this.cleanup();

            if (code !== 0) {
              reject(new Error(`Process exited with code ${code}`));
            }
          },
        );

        // Mark as running after successful spawn
        this.isRunning = true;
        this.emit("start", this.processInfo);
        resolve(this.processInfo);
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  public async stop(timeout = 5000): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.isRunning || !this.process) {
        reject(new Error("No process is running"));
        return;
      }

      try {
        // Try graceful shutdown first
        this.process.kill("SIGTERM");

        // Set up force kill timeout
        const killTimeout = setTimeout(() => {
          if (this.isRunning && this.process) {
            this.process.kill("SIGKILL");
          }
        }, timeout);

        // Handle the exit event
        this.process.once("exit", () => {
          clearTimeout(killTimeout);
          this.cleanup();
          resolve(true);
        });
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  public status(): ProcessStatus {
    if (!this.isRunning || !this.processInfo) {
      return {
        running: false,
        process: null,
      };
    }

    return {
      running: true,
      process: {
        ...this.processInfo,
        startTime: this.processInfo.startTime,
      },
    };
  }

  private cleanup(): void {
    this.isRunning = false;
    this.process = null;
    this.processInfo = null;
  }

  public isProcessRunning(): boolean {
    return this.isRunning;
  }

  public getProcess(): ChildProcess | null {
    return this.process;
  }

  public getPid(): number | null {
    return this.process?.pid ?? null;
  }
}
