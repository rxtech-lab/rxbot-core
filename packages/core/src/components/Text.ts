import {
  type Container,
  type HostContext,
  InstanceType,
  type InternalHandle,
} from "@rx-lab/common";
import { BaseComponent } from "./Component";

export interface TextProps {
  text: string;
  container: Container<any, any>;
  context: HostContext;
  internalInstanceHandle: InternalHandle;
}

/**
 * The Text component is used to render text in the bot. This is the most basic component
 * and in the reconciler, this component will be called during the [`createTextInstance` phase](https://github.com/facebook/react/tree/main/packages/react-reconciler#createtextinstancetext-rootcontainer-hostcontext-internalhandle).
 */
export class Text extends BaseComponent<any> {
  type = InstanceType.Text;

  constructor({ context, container, text }: TextProps) {
    super({
      props: {
        nodeValue: text,
      },
      container,
      hostContext: context,
    });
  }
}
