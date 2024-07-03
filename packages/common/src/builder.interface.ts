import { ReactInstanceType } from "./react";
import { HostContext, InstanceProps } from "./hostconfig.interface";
import { Container } from "./container.interface";
import { Component, ComponentInterface } from "./component.interface";

/**
 * Builder is a class that is responsible for building the instance of the host element.
 * @see packages/core/src/builder/componentBuilder.ts
 **/
export interface Builder {
  /**
   * Build the instance of the host element based on the type and props.
   * This function is used at the beginning of the render phase and
   * should map the instance type to any supported component.
   *
   * @see packages/core/src/builder/componentBuilder.ts
   * @param type InstanceType
   * @param props InstanceProps
   * @param rootContainer Container
   * @param hostContext HostContext
   */
  build(
    type: ReactInstanceType,
    props: InstanceProps,
    rootContainer: Container,
    hostContext: HostContext,
  ): Component;

  /**
   * Clear the builder instance when the render phase is finished.
   */
  clear(): void;

  /**
   * Restore the component from the JSON data.
   * @param data
   */
  buildFromJson(data: ComponentInterface): Component;
}
