import { InstanceType } from "@rx-lab/common";
import { BaseComponent, type ComponentOptions } from "./Component";

interface SuspendableProps {
  shouldSuspend: boolean;
}

export class Suspendable extends BaseComponent<SuspendableProps> {
  constructor(opts: ComponentOptions<SuspendableProps>) {
    super(opts);
    this.type = InstanceType.Suspendable;
  }
}
