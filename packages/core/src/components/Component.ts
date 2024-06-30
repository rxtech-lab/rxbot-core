import {
  Container,
  HostContext,
  InstanceProps,
  InstanceType,
} from "@rx-bot/common";
import { v4 as uuidv4 } from "uuid";

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
  id: string = uuidv4();

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
}
