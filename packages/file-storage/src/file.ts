import { Storage } from "@rx-lab/storage";
import { Component, ComponentInterface } from "@rx-lab/common";
import fs from "fs";

type StoredComponent = { [key: string]: ComponentInterface };
type StoredState = { [key: string]: any };

const stateFile = "state.json";
const componentTreeFile = "component-tree.json";

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

  private async readComponentTree(): Promise<StoredComponent> {
    // check if the file exists
    // if not, create the file with an empty object
    await this.createFileIfNotExists(componentTreeFile, {});

    return new Promise((resolve, reject) => {
      fs.readFile(componentTreeFile, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(data.toString()));
        }
      });
    });
  }

  private async readState(): Promise<StoredState> {
    await this.createFileIfNotExists(stateFile, {});

    return new Promise((resolve, reject) => {
      fs.readFile(stateFile, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(data.toString()));
        }
      });
    });
  }

  private writeComponentTree(componentTree: StoredComponent): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(
        "component-tree.json",
        JSON.stringify(componentTree),
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
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

  async restoreComponentTree(key: string): Promise<Component | undefined> {
    const componentTree = await this.readComponentTree();
    const value = componentTree[key];
    if (!value) {
      return undefined;
    }
    return this.builder.buildFromJson(value);
  }

  async restoreState<T>(key: string): Promise<T | undefined> {
    const state = await this.readState();
    return state[key];
  }

  async saveComponentTree(
    rootContainer: Component,
    key: string,
  ): Promise<void> {
    const componentTree = await this.readComponentTree();
    componentTree[key] = rootContainer.toJSON();
    await this.writeComponentTree(componentTree);
  }

  async saveState<T>(key: string, state: T): Promise<void> {
    const storedState = await this.readState();
    storedState[key] = state;
    await this.writeState(storedState);
    const listener = this.listeners.get(key);
    listener?.();
  }
}
