import {
  type Container,
  type HostContext,
  InstanceType,
  type InternalHandle,
} from "@rx-lab/common";
import { BaseComponent } from "./Component";

export interface CommandProps {
  props: {
    command?: string;
    children: string;
    variant?: "button" | "text";
    renderNewMessage?: boolean;
  };
  container: Container<any, any>;
  context: HostContext;
  internalInstanceHandle: InternalHandle;
}

/**
 * Command component is used to render a command in the bot.
 */
export class Command extends BaseComponent<any> {
  type = InstanceType.Command;

  constructor(props: CommandProps) {
    const { context, container, props: cp } = props;
    super({
      props: cp,
      container,
      hostContext: context,
    });
  }
}
