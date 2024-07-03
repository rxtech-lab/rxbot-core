import {
  Container,
  Component,
  HostContext,
  InstanceProps,
  InstanceType,
  ComponentInterface,
} from "@rx-lab/common";
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
export class BaseComponent extends Component {
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
    super();
    this.props = opts.props;
    this.id = opts.props.key ?? uuid();
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
