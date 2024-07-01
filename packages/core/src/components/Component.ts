import {
  Container,
  ContainerType,
  HostContext,
  InstanceProps,
  InstanceType,
} from "@rx-bot/common";
import { v4 as uuid } from "uuid";
import { isPropsEqual } from "../utils";

export interface ComponentOptions {
  props: InstanceProps;
  container: Container;
  hostContext: HostContext;
}

/**
 * Base component that all components should extend.
 */
export abstract class Component {
  children: Component[] = [];
  /**
   * Unique identifier for the component.
   */
  id: string;

  /**
   * Properties of the component.
   */
  props: InstanceProps;

  /**
   * Type of the component. Useful in the renderer to identify the type of the component.
   */
  type: InstanceType = InstanceType.Container;

  /**
   * Parent of the component.
   */
  parent: Component | null = null;

  constructor(opts: ComponentOptions) {
    this.props = opts.props;
    this.id = opts.props.key ?? uuid();
  }

  /**
   * Check if the component is the root component.
   */
  get isRoot() {
    return (this.parent as unknown as Container).type === ContainerType.ROOT;
  }

  /**
   * Append a child to the component.
   * @param container Container
   */
  appendAsContainerChildren(container: Container) {
    this.parent = container as any;
    container.children.push(this as any);
  }

  /**
   * Append child to the component instance.
   * @param child Child component
   */
  appendChild(child: Component) {
    child.parent = this;
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
    child.parent = this;
    const index = this.children.indexOf(beforeChild);
    this.children.splice(index, 0, child);
  }

  /**
   * Insert `child` after the `afterChild` component.
   */
  insertAfter(child: Component, afterChild: Component) {
    child.parent = this;
    const index = this.children.indexOf(afterChild);
    this.children.splice(index + 1, 0, child);
  }

  /**
   * Finalize the component before mounting.
   * You can do some final logics here before mounting the component to the host.
   * Leave it empty if you don't need to do anything.
   */
  finalizeBeforeMount() {}

  /**
   * Function will be called when the component is set to be updated.
   * @return `true` if the component has been updated, `false` otherwise.
   */
  commitUpdate(oldProps: InstanceProps, newProps: InstanceProps): boolean {
    const isEqual = isPropsEqual(oldProps, newProps);
    if (!isEqual) {
      this.props = newProps;
      return true;
    }
    return false;
  }
}
