/**
 * List of supported instance types for the chatbot.
 * Each implementation of the renderer should support these types.
 * @file hostconfig.interface.ts
 */
export enum InstanceType {
  /**
   * Container is the basic element similar to `div` in html.
   */
  Container = "Container",
  /**
   * Button is the basic ui component in html `<button />`
   */
  Button = "Button",
  /**
   * Text is the basic text instance similar to `createTextInstance` in [React Reconciler package](https://github.com/facebook/react/tree/main/packages/react-reconciler#createtextinstancetext-rootcontainer-hostcontext-internalhandle).
   */
  Text = "Text",
  Link = "Link",
  Command = "Command",
  Paragraph = "Paragraph",
  InlineParagraph = "InlineParagraph",
  Header = "Header",
  List = "List",
  Option = "Option",
  Menu = "Menu",
  Audio = "Audio",
  Video = "Video",
  Image = "Image",
  LineBreak = "LineBreak",
  Suspendable = "Suspendable",
  Code = "Code",
  Pre = "Pre",
  BoldText = "BoldText",
  ItalicText = "ItalicText",
}

/**
 * Props for the instance. In react, these are the props that are passed to the component.
 * @example
 * ```tsx
 * <Button onClick={() => console.log("clicked")}>Click me</Button>
 * ```
 * In the above example, `onClick` is a prop.
 */
export type InstanceProps = Record<string, any> & {
  nodeValue?: string;
  onClick?: () => void;
  key?: string;
};

/**
 * HostContext is the context that is passed to the host element.
 */
export type HostContext = Record<string, any>;

export type InternalHandle = any;
