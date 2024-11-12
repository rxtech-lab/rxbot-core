import {
  type BaseChatroomInfo,
  CoreApi,
  Logger,
  PathParams,
  QueryString,
  ReloadOptions,
} from "@rx-lab/common";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Types and interfaces
type RouteChangeCallback = () => void;
type Queue = (() => void)[];

interface RouterProps<ChatroomInfo, Message> {
  children: ReactNode;
  pathParams: PathParams;
  query: QueryString;
  chatroomInfo: ChatroomInfo;
  message: Message;
  coreApi: CoreApi<any>;
  path: string;
}

interface RouterContextType<ChatroomInfo extends BaseChatroomInfo, Message> {
  addToQueue: (callback: RouteChangeCallback) => void;
  isQueueEmpty: () => boolean;
  notifyRouteChange: () => void;
  registerLoading: (promise: Promise<void>) => void;
  chatroomInfo: ChatroomInfo;
  message: Message;
  query: QueryString;
  pathParams: PathParams;
  path: string;
  coreApi: CoreApi<any>;
  reload: (options?: ReloadOptions) => Promise<void>;
}

// Create the context
export const RouterContext = createContext<
  RouterContextType<BaseChatroomInfo, any> | undefined
>(undefined);

// Debounce function
function debounce<F extends (...args: any[]) => void>(
  func: F,
  wait: number,
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// RouterProvider component
export function RouterProvider<ChatroomInfo extends BaseChatroomInfo, Message>({
  children,
  chatroomInfo,
  message,
  query,
  coreApi: api,
  ...props
}: RouterProps<ChatroomInfo, Message>) {
  const [queue, setQueue] = useState<Queue>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPromises, setPendingPromises] = useState<Promise<void>[]>([]);
  const [queryParams, setQueryParams] = useState<QueryString>(query);
  const [pathParams, setPathParams] = useState<PathParams>(props.pathParams);
  const [coreApi, setCoreApi] = useState<CoreApi<any>>(api);
  const [path, setPath] = useState<string>(props.path);

  const addToQueue = useCallback((callback: RouteChangeCallback) => {
    Logger.log(`Adding callback to queue: ${callback}`);
    setQueue((prevQueue) => [...prevQueue, callback]);
  }, []);

  const isQueueEmpty = useCallback(() => queue.length === 0, [queue]);

  const notifyRouteChange = useCallback(() => {
    // biome-ignore lint/complexity/noForEach: <explanation>
    queue.forEach((callback) => callback());
    setQueue([]);
  }, [queue]);

  const registerLoading = useCallback((promise: Promise<void>) => {
    setIsLoading(true);
    setPendingPromises((prev) => [...prev, promise]);
  }, []);

  const reload = useCallback(
    async (options?: { shouldRenderNewMessage?: boolean }) => {
      await coreApi.redirectToWithMessage(message as any, path, {
        shouldRender: options?.shouldRenderNewMessage ?? true,
        shouldAddToHistory: false,
      });
    },
    [coreApi, message, path],
  );

  // Create a ref to store the debounced function
  const debouncedEffect = useRef(
    debounce((pendingPromises: Promise<any>[]) => {
      setIsLoading(true);
      if (pendingPromises.length > 0) {
        Promise.all(pendingPromises)
          .then(() => {
            Logger.log("All pending promises resolved");
            setIsLoading(false);
            setPendingPromises([]);
          })
          .catch((error) => {
            console.error("Error during loading:", error);
            setIsLoading(false);
            setPendingPromises([]);
          });
      } else {
        setIsLoading(false);
      }
    }, 100), // 100ms debounce time, adjust as needed
  );

  useEffect(() => {
    debouncedEffect.current(pendingPromises);
  }, [pendingPromises]);

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
    addToQueue,
    isQueueEmpty,
    notifyRouteChange,
    registerLoading,
    chatroomInfo: chatroomInfo,
    message: message,
    query,
    pathParams: pathParams,
    path,
    coreApi,
    reload,
  };

  Logger.log(`RouterProvider isLoading: ${isLoading}`, "red");
  return (
    <RouterContext.Provider value={contextValue}>
      <suspendable shouldSuspend={isLoading}>{children}</suspendable>
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
