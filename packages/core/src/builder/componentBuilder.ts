import { Builder } from "./builder";
import {
  Container,
  HostContext,
  Instance,
  InstanceProps,
  InstanceType,
  ReactInstanceType,
} from "@rx-bot/common";
import { Button } from "../components";
import { UnsupportedComponentError } from "@rx-bot/errors";
import { ComponentOptions } from "../components/Component";

type InstanceTypeKeys = keyof typeof InstanceType;

interface Constructor<T> {
  new (opts: ComponentOptions): T;
}

/**
 * ComponentBuilder is a class that is responsible for building the instance of the host element.
 * The target is to create the instance of the host element based on the instance type.
 */
export class ComponentBuilder implements Builder {
  /**
   * Mapper that maps the instance type to the component.
   * Add new supported components here.
   */
  componentMapper: { [key in InstanceTypeKeys]?: Constructor<Instance> } = {
    [InstanceType.Button]: Button as Constructor<Instance>,
  };

  reactInstanceMapper: { [key: string]: InstanceType } = {
    [ReactInstanceType.Button]: InstanceType.Button,
  };

  build(
    reactInstanceType: ReactInstanceType,
    props: InstanceProps,
    rootContainer: Container,
    hostContext: HostContext,
  ): Instance {
    const mappedInstanceType = this.getInstanceType(reactInstanceType);
    // if supported, then create the component
    return this.getComponent(
      mappedInstanceType,
      props,
      rootContainer,
      hostContext,
    );
  }

  /**
   * Get component from instance type
   * @param mappedInstanceType
   * @param props
   * @param container
   * @param hostContext
   * @private
   */
  private getComponent(
    mappedInstanceType: InstanceType,
    props: InstanceProps,
    container: Container,
    hostContext: HostContext,
  ) {
    const Component = this.componentMapper[mappedInstanceType];
    if (!Component) {
      throw new UnsupportedComponentError(mappedInstanceType);
    }

    return new Component({
      props,
      container,
      hostContext,
    });
  }

  /**
   * Get instance type from React instance type
   * @param instanceType
   * @private
   */
  private getInstanceType(instanceType: ReactInstanceType) {
    // first map the instance type to the supported instance type
    const mappedInstanceType = (this.reactInstanceMapper as any)[
      instanceType
    ] as InstanceType | undefined;

    if (!mappedInstanceType) {
      throw new UnsupportedComponentError(instanceType);
    }
    return mappedInstanceType;
  }
}
