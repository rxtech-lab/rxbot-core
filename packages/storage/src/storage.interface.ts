import type { StorageInterface } from "@rx-lab/common";

export abstract class Storage implements StorageInterface {
  listeners: Map<string, () => void> = new Map();

  constructor() {}

  abstract restoreState<T>(key: string): Promise<T | undefined>;

  abstract saveState<T>(key: string, state: T): Promise<void>;

  subscribe(key: string, callback: () => void): () => void {
    this.listeners.set(key, callback);
    return () => {
      this.listeners.delete(key);
    };
  }
}
