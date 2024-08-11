import {
  useCallback,
  useContext,
  useEffect,
  useState as useReactState,
  useSyncExternalStore,
} from "react";
import { StorageContext } from ".";
import { useRouter } from "@rx-lab/router";
import { Logger } from "@rx-lab/common";

const initializedMap = new Map<string, boolean>();

export function useState<T>(key: string, initialState: T) {
  const { client } = useContext(StorageContext);
  const [localState, setLocalState] = useReactState<T>(initialState);
  const { registerLoading } = useRouter();

  // Effect to load initial state from async storage
  useEffect(() => {
    Logger.log(`Loading initial state for key ${key}`);
    if (initializedMap.has(key)) {
      return;
    }
    const loadInitialState = async () => {
      const storedState = await client.restoreState(key);
      Logger.log(
        `Restored state for key ${key}: ${JSON.stringify(storedState)}`,
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
        return client.subscribe(key, () => {
          const loadNewState = async () => {
            Logger.log(`Loading new state for key ${key}`);
            const newState = await client.restoreState(key);
            setLocalState(newState as T);
            onStoreChange();
          };

          registerLoading(loadNewState());
        });
      },
      [client, key, registerLoading],
    ),
    () => localState,
    () => initialState,
  );

  const setState = useCallback(
    (newState: T) => {
      Logger.log(`Saving state for key ${key}`);
      registerLoading(
        client
          .saveState(key, newState)
          .then(() => {
            setLocalState(newState); // Update local state immediately
          })
          .catch((error) => {
            console.error("Failed to save state:", error);
          }),
      );
    },
    [client, key, registerLoading],
  );

  return [state, setState] as const;
}
