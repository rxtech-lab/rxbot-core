import {
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  useState as useReactState,
} from "react";
import { StorageContext } from "../storage.context";

export function useState<T>(key: string, initialState: T) {
  const { client } = useContext(StorageContext);
  const [localState, setLocalState] = useReactState<T>(initialState);

  // Effect to load initial state from async storage
  useEffect(() => {
    client.restoreState(key).then((storedState) => {
      if (storedState !== undefined) {
        setLocalState(storedState as T);
      }
    });
  }, [client, key]);

  const state = useSyncExternalStore<T>(
    useCallback(
      (onStoreChange) => {
        return client.subscribe(key, async () => {
          const newState = await client.restoreState(key);
          setLocalState(newState as T);
          onStoreChange();
        });
      },
      [client, key],
    ),
    () => localState,
    () => initialState,
  );

  const setState = useCallback(
    (newState: T) => {
      setLocalState(newState); // Update local state immediately
      client
        .saveState(key, newState)
        .then(() => {
          // Optionally handle successful save
        })
        .catch((error) => {
          // Handle error, maybe revert local state
          console.error("Failed to save state:", error);
        });
    },
    [client, key],
  );

  return [state, setState] as const;
}
