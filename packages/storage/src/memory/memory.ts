import { Storage } from "../storage.interface";

/**
 * MemoryStorage is a storage that stores the component tree and state in memory.
 */
export class MemoryStorage extends Storage {
  private stateMap = new Map<string, any>();

  async restoreState<T>(key: string): Promise<T | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return this.stateMap.get(key);
  }

  async saveState<T>(key: string, state: T): Promise<void> {
    // Simulate a delay to make it more realistic
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.stateMap.set(key, state);
    const listener = this.listeners.get(key);
    listener?.();
  }
}
