import type {
  Route,
  SetStateOptions,
  StorageInterface,
  StoredRoute,
} from "@rx-lab/common";

export const STATE_KEY = "state";
export const ROUTE_KEY = "route";
export const HISTORY_KEY = "history";

export abstract class Storage implements StorageInterface {
  stateChangeListeners: Map<string, () => void> = new Map();
  routeChangeListeners: Map<string, () => void> = new Map();

  abstract restoreState<T>(
    key: string,
    route: StoredRoute,
  ): Promise<T | undefined>;

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

  abstract restoreRoute(key: string): Promise<StoredRoute | undefined>;

  abstract saveRoute(key: string, path: StoredRoute): Promise<void>;

  abstract deleteState(key: string, route: StoredRoute): Promise<void>;

  abstract addHistory(key: string, route: StoredRoute): Promise<void>;

  abstract deleteHistory(key: string): Promise<void>;

  abstract restoreHistory(key: string): Promise<StoredRoute | undefined>;
}
