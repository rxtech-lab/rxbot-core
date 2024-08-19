import type { Container } from "./container.interface";

export interface Renderer<T extends Container<any, any>> {
  /**
   * Loads a previously stored route from the given path and renders it.
   * This is typically used when restoring a user's session or navigating
   * to a bookmarked/saved state.
   *
   * @param path The URL path of the stored route to load and render.
   * @returns A promise that resolves when the route has been loaded and rendered.
   *
   * @example
   * // Assume we have a renderer instance
   * const renderer = new MyRenderer();
   *
   * // Load and render a stored route
   * await renderer.loadAndRenderStoredRoute("/user/profile");
   *
   * // This might restore a user's profile page from a previous session
   */
  loadAndRenderStoredRoute: (path: string) => Promise<void>;

  /**
   * Initializes the renderer, setting up any necessary configurations,
   * event listeners, or resources required for rendering.
   *
   * @returns A promise that resolves when initialization is complete.
   *
   * @example
   * const renderer = new MyRenderer();
   *
   * // Initialize the renderer before use
   * await renderer.init();
   *
   * // Now the renderer is ready for use
   */
  init: () => Promise<void>;

  /**
   * Renders the application into the provided container.
   * This method is responsible for taking the current application state
   * and rendering it into the DOM or whatever output medium is being used.
   *
   * @param container The container to render the application into.
   * @returns The result of the rendering process, which could be a promise,
   *          a rendered component, or any other relevant data.
   *
   * @example
   * const renderer = new MyRenderer();
   * const container = {
   *   chatroomInfo: { id: "chat123" },
   *   message: { text: "Hello, world!" },
   *   children: []
   * };
   *
   * // Render the application into the container
   * const result = await renderer.render(container);
   *
   * // The result might be the updated container, a virtual DOM tree,
   * // or any other representation of the rendered application
   */
  render: (container: T) => any;

  /**
   * Cleans up and destroys the renderer, releasing any resources or
   * event listeners that were set up during initialization.
   */
  onDestroy: () => Promise<void>;
}
