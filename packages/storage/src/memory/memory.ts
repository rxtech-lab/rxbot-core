import { ROUTE_KEY, STATE_KEY, Storage } from "../storage.interface";

/**
 * MemoryStorage is a storage that stores the component tree and state in memory.
 */
export class MemoryStorage extends Storage {
  private stateMap = new Map<string, any>();
  private routeMap = new Map<string, string>();

  async restoreState<T>(key: string): Promise<T | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return this.stateMap.get(`${STATE_KEY}-${key}`);
  }

  async saveState<T>(key: string, state: T): Promise<void> {
    // Simulate a delay to make it more realistic
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.stateMap.set(`${STATE_KEY}-${key}`, state);
    const listener = this.stateChangeListeners.get(`${STATE_KEY}-${key}`);
    listener?.();
  }

  async restoreRoute(key: string): Promise<string | undefined> {
    return this.routeMap.get(`${ROUTE_KEY}-${key}`);
  }

  async saveRoute(key: string, path: string): Promise<void> {
    this.routeMap.set(`${ROUTE_KEY}-${key}`, path);
    const listener = this.routeChangeListeners.get(`${ROUTE_KEY}-${key}`);
    listener?.();
  }
}
