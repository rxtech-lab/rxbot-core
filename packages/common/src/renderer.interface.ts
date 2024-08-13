import type { Container } from "./container.interface";
import type { ClientComponent } from "./router.interface";

export interface Renderer<T extends Container<any, any>> {
  setComponent: (element: ClientComponent) => void;
  init: () => Promise<void>;
  render: (container: T) => any;
}
