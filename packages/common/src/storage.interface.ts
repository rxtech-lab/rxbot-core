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
