export interface ReconcilerApi<Container> {
  renderApp: (
    container: Container,
    callback: (container: Container) => Promise<void>,
  ) => Promise<Container>;
}

export interface Menu {
  /**
   * The name of the menu.
   */
  name: string;
  /**
   * The description of the menu.
   */
  description?: string;
  /**
   * The href of the menu.
   */
  href: string;
  /**
   * The children of the menu.
   */
  children?: Menu[];
}

export interface AdapterInterface<Container, AdaptElement, Message> {
  /**
   * Lifecycle method that will be called when the adapter is initialized.
   * @param api
   */
  init: (api: ReconcilerApi<Container>) => Promise<void>;
  /**
   * Lifecycle method that will be called when the component is mounted.
   * @param container
   */
  componentOnMount: (container: Container) => Promise<void>;
  /**
   * Adapt the container to the corresponding element.
   * @param container
   * @param isUpdate If the UI is being updated.
   */
  adapt: (container: Container, isUpdate: boolean) => Promise<AdaptElement>;
  /**
   * Set the menus for the target platform.
   * @param menus
   */
  setMenus: (menus: Menu[]) => Promise<void>;

  /**
   * Get current route.
   */
  getCurrentRoute: (message: Message) => Promise<string | undefined>;
}
