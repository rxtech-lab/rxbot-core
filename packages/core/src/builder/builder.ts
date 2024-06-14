import {
  Container,
  HostContext,
  Instance,
  InstanceProps,
  InstanceType,
  ReactInstanceType,
} from "@rx-bot/common";

/**
 * Builder is a class that is responsible for building the instance of the host element.
 * @see packages/core/src/builder/componentBuilder.ts
 **/
export interface Builder {
  /**
   * Build the instance of the host element based on the type and props.
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
  ): Instance;
}
