import { Container, HostContext, InstanceProps } from "@rx-bot/common";

export interface ComponentOptions {
  props: InstanceProps;
  container: Container;
  hostContext: HostContext;
}

export class Component {
  constructor(opts: ComponentOptions) {}
}
