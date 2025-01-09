import { BaseMessage, Container } from "./container.interface";
import { SendMessage } from "./core.interface";
import {
  ReloadOptions,
  SpecialRouteType,
  StoredRoute,
} from "./router.interface";

export type GetRouteKeyLevel = "message" | "chatroom" | "auto";

export interface RedirectOptions {
  /**
   * Indicates whether the application should re-render after the redirect.
   *
   * @default false
   */
  shouldRender: boolean;
  /**
   * Indicates whether the route should be added to the application routing history.
   * If set to false, old message may not be interacted with.
   *
   * @default false
   */
  shouldAddToHistory: boolean;

  /**
   * Should keep the text message in the container.
   */
  keepTextMessage?: boolean;

  /**
   * Should render with old props. Usually, we set this to true when we are doing the redirect.
   * @default false
   */
  shouldRenderWithOldProps?: boolean;

  /**
   * User ID: A unique identifier used to identify the user.
   * When redirecting, it's essential to use the user's ID instead of the bot's ID to maintain user-specific state.
   */
  userId?: string;
}

export interface CreateContainerOptions {
  /**
   * Indicates whether the application should update the current message or render a new one.
   */
  renderNewMessage: boolean;
  /**
   * User ID: A unique identifier used to identify the user.
   * When redirecting, it's essential to use the user's ID instead of the bot's ID to maintain user-specific state.
   */
  userId?: string;
}

export type SpecialRoute = {
  type: Omit<SpecialRouteType, "page">;
  error: Error;
};

export interface ClientRedirectOptions
  extends Pick<RedirectOptions, "shouldAddToHistory" | "shouldRender"> {
  /**
   * Indicates whether the application should update the current message or render a new one.
   */
  renderNewMessage: boolean;
  /**
   * User ID: A unique identifier used to identify the user.
   * When redirecting, it's essential to use the user's ID instead of the bot's ID to maintain user-specific state.
   */
  userId?: string;
}

export interface CoreApi<C extends Container<any, any>> {
  /**
   * Renders the application and handles state updates.
   * This method should be called when a state change occurs that requires re-rendering.
   *
   * @param container The container object representing the current state of the UI.
   * @param callback A function to be called after the initial render, typically used for state updates.
   * @returns A promise that resolves to the updated Container.
   *
   * @example
   * const updatedContainer = await reconcilerApi.renderApp(
   *   currentContainer,
   *   async (container) => {
   *     // Perform state updates here
   *     await updateUserProfile(container);
   *   }
   * );
   */
  renderApp: (
    container: C,
    callback: (container: C) => Promise<void>,
  ) => Promise<C>;

  /**
   * Redirects the user to the specified path.
   * This will first store the current path and re-render the application at the new path if re-rendering is set to true.
   *
   * @param container The container object representing the current state of the UI.
   * @param path The path to redirect to.
   * @param options Options for the redirect operation.
   *
   * @example
   * await reconcilerApi.redirectTo("somekey","/home", { shouldRender: true }); // Redirects to the home page and re-renders the application
   *
   * @example
   * await reconcilerApi.redirectTo("somekey","/settings", { shouldRender: false }); // Redirects to the settings page without re-rendering
   *
   */
  redirectTo: (
    container: C,
    path: StoredRoute | SpecialRoute,
    options: RedirectOptions,
  ) => Promise<C | undefined>;

  /**
   * Redirects the user using message. This api provides
   * exactly the same functionality as redirectTo but needs
   * a message object instead of a container.
   *
   * It will create a container from the message and then
   * call redirectTo.
   *
   * @param message The message object representing the current state of the UI.
   * @param path The path to redirect to.
   * @param options Options for the redirect operation.
   */
  clientRedirectTo: (
    message: BaseMessage,
    path: string,
    options: ClientRedirectOptions,
  ) => Promise<C | undefined>;

  /**
   * Finds the route based on the key.
   * @param key The key of the route to find. Might be a callback data if using a telegram adapter.
   *
   * @returns A promise that resolves to the Route object.
   */
  restoreRoute: (key: string) => Promise<StoredRoute | undefined>;

  /**
   * Reloads the current route.
   * @param opt Options for the reload operation.
   *
   * @example
   * await reload({ shouldRenderNewMessage: true }); // will render a new message below
   * await reload({ shouldRenderNewMessage: false }); // will update the current message
   */
  reload: (message: BaseMessage, opt: ReloadOptions) => Promise<void>;
}

export interface Menu {
  /**
   * The display name of the menu item.
   */
  name: string;

  /**
   * An optional description of the menu item.
   */
  description?: string;

  /**
   * The route or URL that this menu item links to.
   */
  href: string;

  /**
   * Optional sub-menu items.
   */
  children?: Menu[];
}

export interface AdapterInterface<
  C extends Container<any, any>,
  AdaptElement,
  Message,
> {
  /**
   * Initializes the adapter with the given reconciler API.
   * This method is called once when the adapter is first set up.
   *
   * @param api The reconciler API to be used by the adapter.
   *
   * @example
   * await adapter.init({
   *   renderApp: async (container, callback) => {
   *     // Implementation of renderApp
   *   }
   * });
   */
  init: (api: CoreApi<C>) => Promise<void>;

  /**
   * Lifecycle method called when a component is mounted.
   * Use this for any necessary setup or side effects when a new component is added to the UI.
   *
   * @param container The container object representing the current state of the UI.
   *
   * @example
   * await adapter.componentOnMount(container);
   */
  componentOnMount: (container: C) => Promise<void>;

  /**
   * Adapts the container to the corresponding UI element for the target platform.
   * This method is responsible for translating the abstract container into concrete UI elements.
   *
   * @param container The container object representing the current state of the UI.
   * @param isUpdate Indicates whether this is an update to an existing UI or a new render.
   * @returns A promise that resolves to the adapted UI element. If the element is not rendered, return undefined.
   *
   * @example
   * const uiElement = await adapter.adapt(container, false);
   */
  adapt: (container: C, isUpdate: boolean) => Promise<C | undefined>;

  /**
   * Sets up the menu structure for the target platform.
   *
   * @param menus An array of Menu objects representing the menu structure.
   *
   * @example
   * await adapter.setMenus([
   *   {
   *     name: "Home",
   *     href: "/",
   *     children: [
   *       { name: "Profile", href: "/profile" },
   *       { name: "Settings", href: "/settings" }
   *     ]
   *   }
   * ]);
   */
  setMenus: (menus: Menu[]) => Promise<void>;

  /**
   * Parses a platform-specific route into a standardized format.
   * This is useful when dealing with platforms that have limitations on route formats.
   *
   * @param route The platform-specific route string.
   * @returns The standardized route string.
   *
   * @example
   * // For a platform that uses underscores instead of slashes after the first level
   * // parse route from callback data
   * const standardRoute = await adapter.decodeRoute("encoded_route");
   * console.log(standardRoute); // Outputs: "/settings/profile/edit"
   *
   * //parse route from message
   * const standardRoute = await adapter.decodeRoute({ someObject }); // Outputs: "/settings/profile"
   */
  decodeRoute: (route: any) => Promise<StoredRoute | undefined>;

  /**
   * Retrieves a unique route key from the container.
   *
   * This key is used to identify the route for each individual message, allowing for:
   * 1. Tracking different routes across multiple messages in a single user's conversation.
   * 2. Distinguishing routes for messages in separate chat rooms or conversations.
   *
   * The generated key should be unique for each message to enable precise route identification.
   *
   * @example
   * const routeKey = adapter.getRouteKey(container);
   * await storage.saveRoute(routeKey, currentPath);
   *
   * @param container - The container object holding message context
   * @returns A unique string key identifying the route for the current message
   */
  getRouteKey: (container: C, level?: GetRouteKeyLevel) => string;

  /**
   * Lifecycle method called when core is destroyed.
   */
  onDestroy: () => Promise<void>;

  /**
   * Subscribes to message changes.
   * This method should be called by core.
   * @param callback
   */
  subscribeToMessageChanged(
    callback: (container: C, message: Message) => Promise<void>,
  ): void;

  /**
   * Handles webhook message updates. Generally, this method should be called by core.
   * Check `handleMessageUpdate` in the core for more details.
   * @param message The message to be updated.
   */
  handleMessageUpdate: (message: Message) => Promise<void>;

  handleSendMessage: (message: SendMessage) => Promise<void>;

  /**
   * Creates a container from a message.
   * @param message
   * @param options Options for creating the container.
   */
  createContainer: (
    message: Message,
    options: CreateContainerOptions,
  ) => Promise<C>;

  /**
   * Authorizes the request.
   * @param request The full request object.
   * @returns A promise that resolves if the request is authorized, otherwise rejects with an error.
   */
  authorize: (request: Request) => Promise<void>;
}
