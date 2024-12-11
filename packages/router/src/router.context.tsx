import EventEmitter from "node:events";
import {
  type BaseChatroomInfo,
  CoreApi,
  Logger,
  PathParams,
  QueryString,
} from "@rx-lab/common";
import { debounce } from "lodash";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type RegisterLoadingOptions = {
  key: string;
  shouldUpdate: boolean;
};

interface RouterProps<ChatroomInfo extends BaseChatroomInfo, Message> {
  children: ReactNode;
  pathParams: PathParams;
  query: QueryString;
  chatroomInfo: ChatroomInfo;
  message: Message;
  coreApi: CoreApi<any>;
  path: string;
}

interface RouterContextType<ChatroomInfo extends BaseChatroomInfo, Message> {
  registerLoading: (
    promise: () => Promise<any>,
    opts: RegisterLoadingOptions,
  ) => void;
  chatroomInfo: ChatroomInfo;
  message: Message;
  query: QueryString;
  pathParams: PathParams;
  path: string;
  coreApi: CoreApi<any>;
  eventEmitter: EventEmitter;
}

const eventEmitter = new EventEmitter();

// Create the context
export const RouterContext = createContext<
  RouterContextType<BaseChatroomInfo, any> | undefined
>(undefined);

// RouterProvider component
export function RouterProvider<ChatroomInfo extends BaseChatroomInfo, Message>({
  children,
  chatroomInfo,
  message,
  query,
  coreApi: api,
  ...props
}: RouterProps<ChatroomInfo, Message>) {
  const isLoading = useRef(true);
  const pendingPromises = useRef<Promise<void>[]>([]);
  // update function that triggers a re-render
  const [_, update] = useState({});
  const [queryParams, setQueryParams] = useState<QueryString>(query);
  const [pathParams, setPathParams] = useState<PathParams>(props.pathParams);
  const [coreApi, setCoreApi] = useState<CoreApi<any>>(api);
  const [path, setPath] = useState<string>(props.path);

  const debouncedCheckPromises = useCallback(
    debounce(
      (shouldUpdate: boolean) => {
        if (pendingPromises.current.length > 0) {
          Logger.log("Setting isLoading to true");
          Promise.all(pendingPromises.current)
            .then(() => {
              Logger.log("All pending promises resolved");
            })
            .catch((error) => {
              console.error("Error during loading:", error);
              update({});
            })
            .finally(() => {
              Logger.log("Clearing pending promises");
              pendingPromises.current = [];
              isLoading.current = false;
              update({});
            });
        }
      },
      200,
      {
        trailing: true,
        leading: false,
        maxWait: 200,
      },
    ),
    [],
  );

  const registerLoading = useCallback(
    (promise: () => Promise<any>, opts: RegisterLoadingOptions) => {
      isLoading.current = true;
      Logger.log(`Setting isLoading to true for key: ${opts.key}`);
      const wrappedPromise = promise().then((value) => {
        if (value !== undefined) {
          Logger.log(`emitting loadingComplete-${opts.key} value: ${value}`);
          eventEmitter.emit(`loadingComplete`, opts.key, value);
        }
        return value;
      });

      pendingPromises.current.push(wrappedPromise);
      debouncedCheckPromises(opts.shouldUpdate); // Trigger check for resolved promises
    },
    [debouncedCheckPromises],
  );

  useEffect(() => {
    if (pendingPromises.current.length === 0) {
      isLoading.current = false;
      Logger.log("Setting isLoading to false");
      update(Date.now()); // Force a re-render
    }
  }, []);

  // listen to params changes
  useEffect(() => {
    setQueryParams(query);
  }, [query]);

  useEffect(() => {
    setPathParams(props.pathParams);
  }, [props.pathParams]);

  useEffect(() => {
    setCoreApi(api);
  }, [api]);

  useEffect(() => {
    setPath(props.path);
  }, [props.path]);

  const contextValue: RouterContextType<ChatroomInfo, Message> = {
    chatroomInfo: chatroomInfo,
    message: message,
    query,
    pathParams: pathParams,
    registerLoading,
    path,
    coreApi,
    eventEmitter,
  };

  Logger.log(`RouterProvider isLoading: ${isLoading.current}`, "red");
  return (
    <RouterContext.Provider value={contextValue}>
      <suspendable shouldSuspend={isLoading.current}>{children}</suspendable>
    </RouterContext.Provider>
  );
}

/**
 * Custom hook to access the router context within components.
 * This hook provides access to routing-related functionality and state.
 *
 * **IMPORTANT NOTES:**
 * - When useState is loading remote states, the router will pause rendering.
 * - No content will be sent to the end user during this loading phase.
 *
 * **INTERNAL API WARNING:**
 * Some methods returned by this hook, such as `addToQueue`, are for internal use only.
 * These should not be used directly by library consumers. use `@rx-lab/router/hooks` instead.
 *
 * @returns {RouterContextType} The router context containing various routing utilities.
 * @throws {Error} If used outside a RouterProvider.
 *
 * @example
 * Example of internal usage (NOT FOR END USERS):
 *
 * function SomeInternalComponent() {
 *   const { addToQueue } = useRouter();
 *
 *   useEffect(() => {
 *     addToQueue(() => {
 *       console.log("Route has changed");
 *       // Perform some internal operations
 *     });
 *   }, []);
 *
 *   // Rest of the component logic...
 * }
 *
 */
export function useRouter(): RouterContextType<any, any> {
  // Attempt to access the RouterContext
  const context = useContext(RouterContext);

  // Check if the context is undefined, which means the hook is used outside of a RouterProvider
  if (context === undefined) {
    throw new Error("useRouter must be used within a RouterProvider");
  }

  // Return the context if it's available
  return context;
}
