export interface ReconcilerApi<Container> {
  renderApp: (
    container: Container,
    callback: (container: Container) => Promise<void>,
  ) => Promise<Container>;
}

export interface AdapterInterface<Container, AdaptElement> {
  init: (api: ReconcilerApi<Container>) => Promise<void>;
  componentOnMount: (container: Container) => Promise<void>;
  /**
   * Adapt the container to the corresponding element.
   * @param container
   * @param isUpdate If the UI is being updated.
   */
  adapt: (container: Container, isUpdate: boolean) => Promise<AdaptElement>;
}
