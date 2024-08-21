import { Route } from "@rx-lab/common";
import { ROUTE_KEY, STATE_KEY, Storage } from "../storage.interface";

interface State<T> {
  route: string;
  state: T;
}

/**
 * MemoryStorage is a storage that stores the component tree and state in memory.
 */
export class MemoryStorage extends Storage {
  private stateMap = new Map<string, State<any>>();
  private routeMap = new Map<string, string>();
  private historyMap = new Map<string, Route>();

  async restoreState<T>(key: string, route: Route): Promise<T | undefined> {
    const state = this.stateMap.get(`${STATE_KEY}-${key}`);
    return state?.state;
  }

  async saveState<T>(key: string, route: Route, state: T): Promise<void> {
    this.stateMap.set(`${STATE_KEY}-${key}`, {
      route: route,
      state,
    });
    const listener = this.stateChangeListeners.get(`${STATE_KEY}-${key}`);
    listener?.();
  }

  async deleteState(key: string, route: Route): Promise<void> {
    this.stateMap.delete(`${STATE_KEY}-${key}`);
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

  async addHistory(key: string, route: Route): Promise<void> {
    this.historyMap.set(key, route);
  }

  async deleteHistory(key: string): Promise<void> {
    this.historyMap.delete(key);
  }

  async restoreHistory(key: string): Promise<Route | undefined> {
    return this.historyMap.get(key);
  }
}
