/**
 * List of html instance types for the chatbot.
 * Together with the InstanceType enum, we will map the html instance types to the chatbot instance types.
 */
export enum ReactInstanceType {
  Div = "div",
  /**
   * Button element maps to the `<button />` element in the html.
   */
  Button = "button",
  /**
   * Text instance similar to the text instance in the [React reconciler](https://github.com/facebook/react/tree/main/packages/react-reconciler#createtextinstancetext-rootcontainer-hostcontext-internalhandle) package.
   */
  Text = "text",
  List = "list",
  Option = "option",
  Menu = "menu",
  Audio = "audio",
  Video = "video",
  Image = "image",
  Img = "img",
  Paragraph = "p",
  Link = "a",
  Span = "span",
  Input = "input",
  Form = "form",
  Label = "label",
  Select = "select",
  TextArea = "textarea",
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  H4 = "h4",
  H5 = "h5",
  H6 = "h6",
  Table = "table",
  TableRow = "tr",
  TableData = "td",
  TableHeader = "th",
  TableBody = "tbody",
  TableHead = "thead",
  TableFoot = "tfoot",
  TableCaption = "caption",
  TableCol = "col",
  TableColGroup = "colgroup",
  FieldSet = "fieldset",
  NewLine = "br",
  ThematicBreak = "hr",
  Suspendable = "suspendable",
  Command = "command",
}
