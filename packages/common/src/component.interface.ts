import { InstanceProps, InstanceType } from "./hostconfig.interface";
import { Container } from "./container.interface";

export interface Component {
  children: Component[];
  id: string;
  props: InstanceProps;
  type: InstanceType;
  parent: Component | null;

  isRoot: boolean;

  appendAsContainerChildren(container: Container): void;
  appendChild(child: Component): void;
  removeChild(child: Component): void;
  insertBefore(child: Component, beforeChild: Component): void;
  insertAfter(child: Component, afterChild: Component): void;
  finalizeBeforeMount(): void;
  commitUpdate(oldProps: InstanceProps, newProps: InstanceProps): boolean;
}
