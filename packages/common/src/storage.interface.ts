import { Route, StoredRoute } from "./router.interface";

export type StateScope = "chatroom" | "message";

export interface SetStateOptions {
  /**
   * Whether the state should be persisted.
   * By default, some provider may not persist the state, by setting this option to true, the state will be persisted.
   */
  isPersisted?: boolean;

  /**
   * Options for state storage. By default, states are message-scoped and
   * are not persisted across message boundaries. You can change this behavior
   * by setting the scope to "chatroom".
   */
  scope?: StateScope;
}

export interface RestoreStateOptions
  extends Omit<SetStateOptions, "isPersisted"> {}

/**
 * Defines the interface for storage operations in the application.
 * This interface provides methods for saving, restoring, and managing state and routes.
 */
export interface StorageInterface {
  /**
   * Saves the state to the storage.
   * Implementations should use the corresponding storage provider to persist the state.
   *
   * @param key - A unique identifier for the state.
   * @param route - The route associated with the state.
   * @param state - The state data to be saved.
   * @param opt - Options for setting the state.
   * @returns A promise that resolves when the state is successfully saved.
   *
   * @example
   * const storage = new FileStorage();
   * await storage.saveState("simple", "/route1", 0);
   */
  saveState<T>(
    key: string,
    route: Route,
    state: T,
    opt?: SetStateOptions,
  ): Promise<void>;

  /**
   * Retrieves the state from the storage.
   *
   * @param key - The unique identifier for the state.
   * @param route - The route associated with the state.
   * @returns A promise that resolves with the retrieved state, or undefined if not found.
   *
   * @example
   * const storage = new FileStorage();
   * const state = await storage.restoreState("simple", "/route1"); // 0
   */
  restoreState<T>(key: string, route: StoredRoute): Promise<T | undefined>;

  /**
   * Deletes the state from the storage.
   *
   * @param key - The unique identifier for the state to be deleted.
   * @param route - The route associated with the state.
   * @returns A promise that resolves when the state is successfully deleted.
   *
   * @example
   * const storage = new FileStorage();
   * await storage.deleteState("simple", "/route1");
   */
  deleteState(key: string, route: StoredRoute): Promise<void>;

  /**
   * Subscribes to state changes for a specific key.
   *
   * @param key - The unique identifier for the state to watch.
   * @param route - The route associated with the state.
   * @param callback - A function to be called when the state changes.
   * @returns A function that, when called, unsubscribes from the state changes.
   */
  subscribeStateChange(
    key: string,
    route: Route,
    callback: () => void,
  ): () => void;

  /**
   * Subscribes to route changes for a specific key.
   *
   * @param key - The unique identifier for the route to watch.
   * @param callback - A function to be called when the route changes.
   * @returns A function that, when called, unsubscribes from the route changes.
   */
  subscribeRouteChange(key: string, callback: () => void): () => void;

  /**
   * Saves current route to the storage.
   *
   * @param key - A unique identifier for the route. This is typically determined by the adapter.
   * @param path - The path of the route to be saved.
   * @returns A promise that resolves when the route is successfully saved.
   */
  saveRoute(key: string, path: StoredRoute): Promise<void>;

  /**
   * Retrieves current route from the storage.
   *
   * @param key - The unique identifier for the route. This is typically determined by the adapter.
   * @returns A promise that resolves with the retrieved route, or undefined if not found.
   */
  restoreRoute(key: string): Promise<StoredRoute | undefined>;

  /**
   * Adds a route to the history storage.
   * In the Telegram platform, each message is associated with one route.
   * @param key - Unique identifier for the history entry (e.g., message ID)
   * @param route - Route to be saved. Should also include query parameters and path parameters if applicable.
   * @returns A promise that resolves when the operation is complete
   */
  addHistory(key: string | number, route: StoredRoute): Promise<void>;

  /**
   * Removes a specific route from the history storage.
   * @param key - Unique identifier for the history entry
   * @returns A promise that resolves when the operation is complete
   */
  deleteHistory(key: string | number): Promise<void>;

  /**
   * Retrieves a route from the history storage.
   * @param key - Unique identifier for the history entry
   * @returns A promise that resolves with the associated route, or undefined if not found
   */
  restoreHistory(key: string | number): Promise<StoredRoute | undefined>;
}

/**
 * Storage interface in server components
 */
export interface StorageClientInterface {
  /**
   * Save state to the storage.
   * @param key - Unique identifier for the state within the current chatroom/message context.
   * @param state - The state to be saved.
   * @param opt - Configuration options for storing the state.
   *
   * ```typescript
   * saveState("userProfile", { name: "John Doe" });
   * ```
   *
   * ```
   * saveState("userProfile", { name: "John Doe" }, { isPersisted: true });
   * ```
   */
  saveState<T>(key: string, state: T, opt?: SetStateOptions): Promise<void>;

  /**
   * Restore state from the storage.
   * @param key - Unique identifier for the state within the current chatroom/message context.
   * @param opt - Configuration options for restoring the state.
   *
   * ```typescript
   * const state = await restoreState("userProfile");
   * ```
   */
  restoreState<T>(
    key: string,
    opt?: RestoreStateOptions,
  ): Promise<T | undefined>;
}
