import {
  type Container,
  type HostContext,
  InstanceType,
  type InternalHandle,
} from "@rx-lab/common";
import { BaseComponent } from "./Component";

export interface ImageProps {
  props: {
    src: string;
    alt: string;
  };
  container: Container<any, any>;
  context: HostContext;
  internalInstanceHandle: InternalHandle;
}

export class Image extends BaseComponent<any> {
  type = InstanceType.Image;

  constructor(props: ImageProps) {
    const { props: componentProps, container, context } = props;
    super({
      props: {
        src: componentProps.src,
        alt: componentProps.alt,
      },
      container,
      hostContext: context,
    });
  }
}
