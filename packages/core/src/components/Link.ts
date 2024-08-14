import {
  type Container,
  type HostContext,
  InstanceType,
  type InternalHandle,
} from "@rx-lab/common";
import { BaseComponent } from "./Component";

export interface LinkProps {
  props: {
    href?: string;
  };
  container: Container<any, any>;
  context: HostContext;
  internalInstanceHandle: InternalHandle;
}

/**
 * Link component is used to render an external link in the bot.
 */
export class Link extends BaseComponent<any> {
  type = InstanceType.Link;
}
