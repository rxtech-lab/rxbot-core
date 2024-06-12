export interface Element {
  type: string;
  props: {
    children: Element[];
    nodeValue: string;
  };
}
