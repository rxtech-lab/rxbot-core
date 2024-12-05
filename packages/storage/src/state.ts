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
  const [localState, setLocalState] = useReactState<T>(initialState);
  const { registerLoading, chatroomInfo, eventEmitter } = useRouter();

  // Generate a unique storage key that includes chatroom context
  const storedKey = encodeStateKey(
    chatroomInfo.id,
    chatroomInfo.messageId,
    key,
    options?.scope,
  );

  // Initialize state from storage on component mount
  useEffect(() => {
    const loadState = async () => {
      Logger.log(`Loading initial state for key ${storedKey}`);
      const newState = await client.restoreState(storedKey, {
        route: DEFAULT_ROOT_ROUTE,
        type: "page",
      });
      // if new state is undefined, which means this is the first time the state is being set
      // we won't set the local state
      if (newState !== undefined) setLocalState(newState as T);
    };

    registerLoading(loadState());
  }, []);

  // Create a memoized setState function that persists changes to storage
  const setState = useCallback(
    (newState: T) => {
      registerLoading(
        client
          .saveState(storedKey, DEFAULT_ROOT_ROUTE, newState, options)
          .catch((error) => {
            console.error("Failed to save state:", error);
          }),
      );
      eventEmitter.once("loadingComplete", () => {
        Logger.log(`Saving state for key ${storedKey}, ${newState}`);
        setLocalState(newState);
      });
    },
    [client, storedKey, registerLoading],
  );

  return [localState, setState] as const;
}
