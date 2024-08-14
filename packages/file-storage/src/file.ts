import { ROUTE_KEY, STATE_KEY, Storage } from "@rx-lab/storage";

import * as fs from "node:fs";

type StoredState = { [key: string]: any };

const OUTPUT_FILE_NAME = "state.json";

export class FileStorage extends Storage {
  private checkIfFileExists(filename: string): Promise<boolean> {
    return new Promise((resolve) =>
      fs.access(filename, fs.constants.F_OK, (err) => {
        resolve(!err);
      }),
    );
  }

  private createFile(filename: string, initialContent: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filename, initialContent, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async createFileIfNotExists(
    filename: string,
    initialContent: any,
  ): Promise<void> {
    const exists = await this.checkIfFileExists(filename);
    if (!exists) {
      await this.createFile(filename, JSON.stringify(initialContent));
    }
  }

  private async readState(): Promise<StoredState> {
    await this.createFileIfNotExists(OUTPUT_FILE_NAME, {});

    return new Promise((resolve, reject) => {
      fs.readFile(OUTPUT_FILE_NAME, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(data.toString()));
        }
      });
    });
  }

  private writeState(state: StoredState): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile("state.json", JSON.stringify(state), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async restoreState<T>(key: string): Promise<T | undefined> {
    const state = await this.readState();
    return state[`${STATE_KEY}-${key}`];
  }

  async saveState<T>(key: string, state: T): Promise<void> {
    const storedState = await this.readState();
    storedState[`${STATE_KEY}-${key}`] = state;
    await this.writeState(storedState);
    const listener = this.stateChangeListeners.get(key);
    listener?.();
  }

  async restoreRoute(key: string): Promise<string | undefined> {
    const state = await this.readState();
    return state[`${ROUTE_KEY}-${key}`];
  }

  async saveRoute(key: string, path: string): Promise<void> {
    const storedState = await this.readState();
    storedState[`${ROUTE_KEY}-${key}`] = path;
    await this.writeState(storedState);
    const listener = this.routeChangeListeners.get(key);
    listener?.();
  }
}
