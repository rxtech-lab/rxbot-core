import { DEFAULT_ROOT_ROUTE, Logger, SetStateOptions } from "@rx-lab/common";
import { useRouter } from "@rx-lab/router";
import {
  useCallback,
  useContext,
  useEffect,
  useState as useReactState,
  useSyncExternalStore,
} from "react";
import { StorageContext } from ".";
import { encodeStateKey } from "./utils";

/**
 * Tracks which state keys have been initialized to prevent redundant loading
 * from storage during component re-renders.
 */
const initializedMap = new Map<string, boolean>();

export type StateScope = "chatroom" | "message";

interface SetStateHookOption {
  /**
   * Options for state storage. By default, states are message-scoped and
   * are not persisted across message boundaries. You can change this behavior
   * by setting the scope to "chatroom".
   */
  scope?: StateScope;
}

/**
 * A custom useState hook that extends React's useState with persistent storage capabilities.
 *
 * Why not use React's useState?
 * - React's built-in useState doesn't persist state across multiple renderings
 * - In chatbot applications, state is lost between message calls as the chatbot provider
 *   typically doesn't maintain state on behalf of the user
 * - This custom implementation stores state in a persistent storage provider, making it
 *   suitable for chatbot applications where state needs to survive across messages
 *
 * Key features:
 * - Persistent storage integration
 * - Automatic chatroom context awareness
 * - State change subscription system
 * - Async state loading with loading state management
 * - State persistence across message boundaries
 * - Automatic state restoration on component remount
 *
 * @param key - Unique identifier for the state within the current chatroom context
 * @param initialState - Default value used when no stored state exists
 * @param options - Configuration options for state updates (e.g., debounce, merge strategy)
 *
 * @returns A tuple containing the current state and a setState function, similar to React's useState
 *
 * @example
 * // State persists across message boundaries and component remounts
 * const [username, setUsername] = useState('userProfile', '');
 */
export function useState<T>(
  key: string,
  initialState: T,
  options?: SetStateOptions & SetStateHookOption,
) {
  const { client } = useContext(StorageContext);
  const [localState, setLocalState] = useReactState<T>(initialState);
  const { registerLoading, chatroomInfo } = useRouter();

  // Generate a unique storage key that includes chatroom context
  const storedKey = encodeStateKey(
    chatroomInfo.id,
    chatroomInfo.messageId,
    key,
    options?.scope,
  );

  // Initialize state from storage on component mount
  useEffect(() => {
    Logger.log(`Loading initial state for key ${storedKey}`);
    if (initializedMap.has(storedKey)) {
      return; // Prevent duplicate initialization
    }

    const loadInitialState = async () => {
      const storedState = await client.restoreState(
        storedKey,
        DEFAULT_ROOT_ROUTE,
      );
      Logger.log(
        `Restored state for key ${storedKey}: ${JSON.stringify(storedState)}`,
      );
      if (storedState !== undefined) {
        setLocalState(storedState as T);
      } else {
        setLocalState(initialState);
      }
    };
    initializedMap.set(key, true);
    registerLoading(loadInitialState());
  }, []);

  // Subscribe to external state changes and sync with local state
  const state = useSyncExternalStore<T>(
    useCallback(
      (onStoreChange) => {
        return client.subscribeStateChange(key, DEFAULT_ROOT_ROUTE, () => {
          const loadNewState = async () => {
            Logger.log(`Loading new state for key ${storedKey}`);
            const newState = await client.restoreState(
              storedKey,
              DEFAULT_ROOT_ROUTE,
            );
            setLocalState(newState as T);
            onStoreChange();
          };

          registerLoading(loadNewState());
        });
      },
      [client, storedKey, registerLoading],
    ),
    () => localState, // Selector for current state
    () => initialState, // Selector for server-side rendering
  );

  // Create a memoized setState function that persists changes to storage
  const setState = useCallback(
    (newState: T) => {
      Logger.log(`Saving state for key ${storedKey}`);
      registerLoading(
        client
          .saveState(storedKey, DEFAULT_ROOT_ROUTE, newState, options)
          .then(() => {
            setLocalState(newState);
          })
          .catch((error) => {
            console.error("Failed to save state:", error);
          }),
      );
    },
    [client, storedKey, registerLoading],
  );

  return [state, setState] as const;
}
