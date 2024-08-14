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

  subscribeStateChange(key: string, callback: () => void): () => void;

  subscribeRouteChange(key: string, callback: () => void): () => void;

  saveRoute(key: string, path: string): Promise<void>;

  restoreRoute(key: string): Promise<string | undefined>;
}
