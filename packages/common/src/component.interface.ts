import { type Container, ContainerType } from "./container.interface";
import type { InstanceProps, InstanceType } from "./hostconfig.interface";

export interface ComponentInterface {
  id: string;
  props: InstanceProps;
  type: InstanceType;
  children: ComponentInterface[];
}

export abstract class Component {
  children: Component[] = [];
  abstract id: string;
  parent: Component | null = null;
  abstract props: InstanceProps;
  abstract type: InstanceType;

  abstract commitUpdate(
    oldProps: InstanceProps,
    newProps: InstanceProps,
  ): boolean;

  abstract finalizeBeforeMount(): void;

  /**
   * Check if the component is the root component.
   */
  get isRoot() {
    return (
      (this.parent as unknown as Container<any, any>).type ===
      ContainerType.ROOT
    );
  }

  /**
   * Append a child to the component.
   * @param container Container
   */
  appendAsContainerChildren(container: Container<any, any>) {
    this.parent = container as any;
    container.children.push(this as any);
  }

  /**
   * Append child to the component instance.
   * @param child Child component
   */
  appendChild(child: Component) {
    child.parent = this as any as Component;
    this.children.push(child);
  }

  /**
   * Remove child from the component instance.
   * @param child
   */
  removeChild(child: Component) {
    child.parent = null;
    const index = this.children.indexOf(child);
    this.children.splice(index, 1);
  }

  /**
   * Insert `child` before the `beforeChild` component.
   * @param child
   * @param beforeChild
   */
  insertBefore(child: Component, beforeChild: Component) {
    child.parent = this as any as Component;
    const index = this.children.indexOf(beforeChild);
    this.children.splice(index, 0, child);
  }

  /**
   * Insert `child` after the `afterChild` component.
   */
  insertAfter(child: Component, afterChild: Component) {
    child.parent = this as any as Component;
    const index = this.children.indexOf(afterChild);
    this.children.splice(index + 1, 0, child);
  }

  toJSON(): ComponentInterface {
    return {
      children: this.children.map((child) => child.toJSON()),
      id: this.id,
      props: this.props,
      type: this.type,
    };
  }
}
