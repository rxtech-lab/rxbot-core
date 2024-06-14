/**
 * List of supported instance types for the chatbot.
 * Each implementation of the renderer should support these types.
 * @file hostconfig.interface.ts
 */
export enum InstanceType {
  Button = "Button",
  Text = "Text",
  List = "List",
  Option = "Option",
  Menu = "Menu",
  Audio = "Audio",
  Video = "Video",
  Image = "Image",
}

/**
 * Props for the instance. In react, these are the props that are passed to the component.
 * @example
 * ```tsx
 * <Button onClick={() => console.log("clicked")}>Click me</Button>
 * ```
 * In the above example, `onClick` is a prop.
 */
export type InstanceProps = Record<string, any>;

/**
 * HostContext is the context that is passed to the host element.
 */
export type HostContext = Record<string, any>;

/**
 * Instance is an abstract representation of a component in the chatbot.
 * Each Instance type will have its own Instance.
 * @fileOverview Go to `core` package to see the implementation of these instances.
 */
export interface Instance {
  type: InstanceType;
  props: InstanceProps;
  children: Instance[];
}
