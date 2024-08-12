export interface StorageInterface {
  /**
   * Save the state to the storage.
   * @param key
   * @param state
   */
  saveState<T>(key: string, state: T): Promise<void>;

  /**
   * Get the state from the storage.
   * @param key
   */
  restoreState<T>(key: string): Promise<T | undefined>;

  subscribe(key: string, callback: () => void): () => void;
}

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
