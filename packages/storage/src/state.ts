import { DEFAULT_ROOT_ROUTE, Logger, SetStateOptions } from "@rx-lab/common";
import { useRouter } from "@rx-lab/router";
import {
  useCallback,
  useContext,
  useEffect,
  useState as useReactState,
} from "react";
import { StorageContext } from ".";
import { encodeStateKey } from "./utils";

export const stateCache = new Map<string, any>();

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
  options?: SetStateOptions,
) {
  const { client } = useContext(StorageContext);
  const { registerLoading, chatroomInfo, eventEmitter, path } = useRouter();

  // Generate the stored key early to use it for cache lookup
  const storedKey = encodeStateKey(
    chatroomInfo.id,
    chatroomInfo.messageId,
    key,
    options?.scope,
  );

  // Use cached state if available, otherwise use initial state
  const [localState, setLocalState] = useReactState<T>(
    stateCache.get(storedKey + path) ?? initialState,
  );

  Logger.log(`Local state: ${storedKey + path}: ${localState}`);

  useEffect(() => {
    Logger.log(`Initializing state for key ${storedKey}`);
    const loadState = async () => {
      const newState = await client.restoreState(storedKey, {
        route: DEFAULT_ROOT_ROUTE,
        type: "page",
      });

      if (newState !== undefined) {
        // only update if the state has changed
        if (newState === localState) {
          return newState as T;
        }
        // Update both cache and local state
        stateCache.set(storedKey + path, newState);
        setLocalState(newState as T);
      }
      Logger.log(
        `Loaded initial state for key ${storedKey}, ${newState}`,
        "bgYellow",
      );
    };
    registerLoading(loadState, {
      key: storedKey,
      shouldUpdate: true,
    });
  }, []);

  const setState = useCallback(
    (newState: T) => {
      eventEmitter.once(`loadingComplete`, (key, value) => {
        if (key === storedKey) {
          Logger.log(`Saving state for key ${storedKey}, ${value}`, "bgYellow");
          // Update both cache and local state
          stateCache.set(storedKey + path, newState);
          setLocalState(newState as T);
        }
      });
      Logger.log(`Setting state for key ${storedKey}, ${newState}`);
      registerLoading(
        async () => {
          await client.saveState(
            storedKey,
            DEFAULT_ROOT_ROUTE,
            newState,
            options,
          );
          return newState as any;
        },
        {
          key: storedKey,
          shouldUpdate: false,
        },
      );
    },
    [client, storedKey, registerLoading],
  );

  return [localState, setState] as const;
}
