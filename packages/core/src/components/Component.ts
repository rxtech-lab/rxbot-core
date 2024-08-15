import {
  Component,
  type Container,
  type HostContext,
  type InstanceProps,
  InstanceType,
} from "@rx-lab/common";
import { v4 as uuid } from "uuid";
import { isPropsEqual } from "../core/utils";

export interface ComponentOptions<Props extends InstanceProps> {
  props: Props;
  container: Container<any, any>;
  hostContext: HostContext;
}

/**
 * Base component that all components should extend.
 */
export class BaseComponent<Props extends InstanceProps> extends Component {
  children: Component[] = [];
  /**
   * Unique identifier for the component.
   */
  id: string;

  /**
   * Properties of the component.
   */
  props: Props;

  /**
   * Type of the component. Useful in the renderer to identify the type of the component.
   */
  type: InstanceType = InstanceType.Container;

  /**
   * Parent of the component.
   */
  parent: Component | null = null;

  constructor(opts: ComponentOptions<Props>) {
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
  commitUpdate(oldProps: Props, newProps: Props): boolean {
    const isEqual = isPropsEqual(oldProps, newProps);
    if (!isEqual) {
      this.props = newProps;
      return true;
    }
    return false;
  }
}
