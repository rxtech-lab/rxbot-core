import { DEFAULT_ROOT_ROUTE, Logger } from "@rx-lab/common";
import { useRouter } from "@rx-lab/router";
import {
  useCallback,
  useContext,
  useEffect,
  useState as useReactState,
  useSyncExternalStore,
} from "react";
import { StorageContext } from ".";

const initializedMap = new Map<string, boolean>();

export function useState<T>(key: string, initialState: T) {
  const { client } = useContext(StorageContext);
  const [localState, setLocalState] = useReactState<T>(initialState);
  const { registerLoading, chatroomInfo } = useRouter();

  // construct the key using chatroom info
  const storedKey = chatroomInfo.messageId
    ? `${chatroomInfo.id}-${chatroomInfo.messageId}-${key}`
    : `${chatroomInfo.id}-${key}`;

  // Effect to load initial state from async storage
  useEffect(() => {
    Logger.log(`Loading initial state for key ${storedKey}`);
    if (initializedMap.has(storedKey)) {
      return;
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
    () => localState,
    () => initialState,
  );

  const setState = useCallback(
    (newState: T) => {
      Logger.log(`Saving state for key ${storedKey}`);
      registerLoading(
        client
          .saveState(storedKey, DEFAULT_ROOT_ROUTE, newState)
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
