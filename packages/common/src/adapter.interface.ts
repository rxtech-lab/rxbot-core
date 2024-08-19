interface RedirectOptions {
  shouldRender: boolean;
}

export interface CoreApi<Container> {
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
    container: Container,
    callback: (container: Container) => Promise<void>,
  ) => Promise<Container>;

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
    container: Container,
    path: string,
    options: RedirectOptions,
  ) => Promise<void>;
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

export interface AdapterInterface<Container, AdaptElement, Message> {
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
  init: (api: CoreApi<Container>) => Promise<void>;

  /**
   * Lifecycle method called when a component is mounted.
   * Use this for any necessary setup or side effects when a new component is added to the UI.
   *
   * @param container The container object representing the current state of the UI.
   *
   * @example
   * await adapter.componentOnMount(container);
   */
  componentOnMount: (container: Container) => Promise<void>;

  /**
   * Adapts the container to the corresponding UI element for the target platform.
   * This method is responsible for translating the abstract container into concrete UI elements.
   *
   * @param container The container object representing the current state of the UI.
   * @param isUpdate Indicates whether this is an update to an existing UI or a new render.
   * @returns A promise that resolves to the adapted UI element.
   *
   * @example
   * const uiElement = await adapter.adapt(container, false);
   */
  adapt: (container: Container, isUpdate: boolean) => Promise<AdaptElement>;

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
   * Retrieves the unprocessed current route based on the given message.
   * This is typically used to determine the current page or state in the application.
   *
   * @param message The message object containing route information.
   * @returns A promise that resolves to the current route string, or undefined if not applicable.
   *
   * @example
   * const currentRoute = await adapter.getCurrentRoute(incomingMessage);
   * console.log(currentRoute); // Outputs: "/home"
   * if (currentRoute) {
   *   // Handle navigation to the current route
   * }
   *
   * @example
   * const currentRoute = await adapter.getCurrentRoute(incomingMessage);
   * console.log(currentRoute); // Outputs: "/settings_profile_edit"
   */
  getCurrentRoute: (message: Message) => Promise<string | undefined>;

  /**
   * Parses a platform-specific route into a standardized format.
   * This is useful when dealing with platforms that have limitations on route formats.
   *
   * @param route The platform-specific route string.
   * @returns The standardized route string.
   *
   * @example
   * // For a platform that uses underscores instead of slashes after the first level
   * const standardRoute = adapter.parseRoute("/settings_profile_edit");
   * console.log(standardRoute); // Outputs: "/settings/profile/edit"
   */
  parseRoute: (route: string) => string;

  /**
   * Retrieves the route key for the given message.
   * @param message
   */
  getRouteKey: (message: Container) => string;

  /**
   * Lifecycle method called when core is destroyed.
   */
  onDestroy: () => Promise<void>;
}
