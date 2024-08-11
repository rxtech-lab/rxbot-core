import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useRef,
  useContext,
} from "react";
import { BaseChatroomInfo, Logger } from "@rx-lab/common";

// Types and interfaces
type RouteChangeCallback = () => void;
type Queue = (() => void)[];

interface RouterProps<ChatroomInfo, Message> {
  children: ReactNode;
  chatroomInfo: ChatroomInfo;
  message: Message;
}

interface RouterContextType<ChatroomInfo extends BaseChatroomInfo, Message> {
  addToQueue: (callback: RouteChangeCallback) => void;
  isQueueEmpty: () => boolean;
  notifyRouteChange: () => void;
  registerLoading: (promise: Promise<void>) => void;
  chatroomInfo: ChatroomInfo;
  message: Message;
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
}: RouterProps<ChatroomInfo, Message>) {
  const [queue, setQueue] = useState<Queue>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPromises, setPendingPromises] = useState<Promise<void>[]>([]);

  const addToQueue = useCallback((callback: RouteChangeCallback) => {
    Logger.log(`Adding callback to queue: ${callback}`);
    setQueue((prevQueue) => [...prevQueue, callback]);
  }, []);

  const isQueueEmpty = useCallback(() => queue.length === 0, [queue]);

  const notifyRouteChange = useCallback(() => {
    queue.forEach((callback) => callback());
    setQueue([]);
  }, [queue]);

  const registerLoading = useCallback((promise: Promise<void>) => {
    setIsLoading(true);
    setPendingPromises((prev) => [...prev, promise]);
  }, []);

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

  const contextValue: RouterContextType<ChatroomInfo, Message> = {
    addToQueue,
    isQueueEmpty,
    notifyRouteChange,
    registerLoading,
    chatroomInfo: chatroomInfo,
    message: message,
  };

  Logger.log(`RouterProvider isLoading: ${isLoading}`, "red");
  return (
    <RouterContext.Provider value={contextValue}>
      <suspendable shouldSuspend={isLoading}>{children}</suspendable>
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (context === undefined) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}
