import { ROUTE_KEY, STATE_KEY, Storage } from "@rx-lab/storage";

import * as fs from "node:fs";
import { Route } from "@rx-lab/common";

interface State {
  route: string;
  state: any;
}

type StoredState = { [key: string]: State };

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
    return state[`${STATE_KEY}-${key}`]?.state;
  }

  async saveState<T>(key: string, route: Route, state: T): Promise<void> {
    const storedState = await this.readState();
    storedState[`${STATE_KEY}-${key}`] = {
      route: route,
      state,
    };
    await this.writeState(storedState);
    const listener = this.stateChangeListeners.get(`${STATE_KEY}-${key}`);
    listener?.();
  }

  async restoreRoute(key: string): Promise<string | undefined> {
    const state = await this.readState();
    return state[`${ROUTE_KEY}-${key}`]?.state;
  }

  async saveRoute(key: string, path: string): Promise<void> {
    const storedState = await this.readState();
    storedState[`${ROUTE_KEY}-${key}`] = {
      state: path,
      route: "",
    };
    await this.writeState(storedState);
    const listener = this.routeChangeListeners.get(`${ROUTE_KEY}-${key}`);
    listener?.();
  }

  async deleteState(key: string, route: Route): Promise<void> {
    const state = await this.readState();
    delete state[`${STATE_KEY}-${key}`];
    await this.writeState(state);
    const listener = this.stateChangeListeners.get(`${STATE_KEY}-${key}`);
    listener?.();
  }

  async restoreRouteFromState(key: string): Promise<Route | undefined> {
    const state = await this.readState();
    return state[`${STATE_KEY}-${key}`]?.route;
  }
}
