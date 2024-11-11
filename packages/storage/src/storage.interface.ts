import type { Route, SetStateOptions, StorageInterface } from "@rx-lab/common";

export const STATE_KEY = "state";
export const ROUTE_KEY = "route";
export const HISTORY_KEY = "history";

export abstract class Storage implements StorageInterface {
  stateChangeListeners: Map<string, () => void> = new Map();
  routeChangeListeners: Map<string, () => void> = new Map();

  abstract restoreState<T>(key: string, route: Route): Promise<T | undefined>;

  abstract saveState<T>(
    key: string,
    route: Route,
    state: T,
    options?: SetStateOptions,
  ): Promise<void>;

  subscribeStateChange(
    key: string,
    route: Route,
    callback: () => void,
  ): () => void {
    this.stateChangeListeners.set(`${STATE_KEY}-${key}`, callback);
    return () => {
      this.stateChangeListeners.delete(`${STATE_KEY}-${key}`);
    };
  }

  subscribeRouteChange(key: string, callback: () => void): () => void {
    this.routeChangeListeners.set(`${ROUTE_KEY}-${key}`, callback);
    return () => {
      this.routeChangeListeners.delete(`${ROUTE_KEY}-${key}`);
    };
  }

  abstract restoreRoute(key: string): Promise<Route | undefined>;

  abstract saveRoute(key: string, path: string): Promise<void>;

  abstract deleteState(key: string, route: Route): Promise<void>;

  abstract addHistory(key: string, route: Route): Promise<void>;

  abstract deleteHistory(key: string): Promise<void>;

  abstract restoreHistory(key: string): Promise<Route | undefined>;
}
