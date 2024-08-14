import type { Container } from "./container.interface";
import type { ClientComponent } from "./router.interface";

export interface Renderer<T extends Container<any, any>> {
  /**
   * Render the app at the given path.
   * @param path The url path to render the app at.
   */
  renderFromStoredRoute: (path: string) => Promise<void>;
  init: () => Promise<void>;
  render: (container: T) => any;
}
