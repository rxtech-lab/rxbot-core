export interface AdapterInterface<Container, AdaptElement> {
  init: () => Promise<void>;
  componentOnMount: (container: Container) => Promise<void>;
  adapt: (container: Container) => Promise<AdaptElement>;
}
