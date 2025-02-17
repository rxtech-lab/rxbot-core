import {
  type Builder,
  type Component,
  type ComponentInterface,
  type Container,
  type HostContext,
  type InstanceProps,
  InstanceType,
  ReactInstanceType,
} from "@rx-lab/common";
import {
  MissingRequiredKeyPropsError,
  UnsupportedComponentError,
  UnsupportedReactComponentError,
} from "@rx-lab/errors";
import { Blockquote } from "../Blockquote";
import { BoldText } from "../BoldText";
import { Code, Pre } from "../Code";
import { ItalicText } from "../ItalicText";
import { InlineParagraph, Paragraph } from "../Paragraph";
import {
  type BaseComponent,
  Button,
  CommandComponent,
  type ComponentOptions,
  Container as ContainerComponent,
  Header,
  Image,
  LineBreak,
  Link,
  Menu,
  Suspendable,
} from "../index";

type InstanceTypeKeys = keyof typeof InstanceType;

interface Constructor<T> {
  new (opts: ComponentOptions<any>): T;
}

/**
 * ComponentBuilder is a class that is responsible for building the instance of the host element.
 * The target is to create the instance of the host element based on the instance type.
 */
export class ComponentBuilder implements Builder {
  /**
   * List of keys that are used to check if the instance has the correct key props.
   * @private
   */
  private keys: string[] = [];

  /**
   * Mapper that maps the instance type to the component.
   * Add new supported components here.
   */
  componentMapper: { [key in InstanceTypeKeys]?: Constructor<Component> } = {
    [InstanceType.Button]: Button,
    [InstanceType.Menu]: Menu,
    [InstanceType.Container]: ContainerComponent,
    [InstanceType.Header]: Header,
    [InstanceType.LineBreak]: LineBreak as unknown as Constructor<
      BaseComponent<any>
    >,
    [InstanceType.Suspendable]: Suspendable,
    [InstanceType.Paragraph]: Paragraph,
    [InstanceType.Link]: Link as unknown as Constructor<BaseComponent<any>>,
    [InstanceType.Command]: CommandComponent as unknown as Constructor<
      BaseComponent<any>
    >,
    [InstanceType.InlineParagraph]: InlineParagraph,
    [InstanceType.Code]: Code,
    [InstanceType.Pre]: Pre,
    [InstanceType.BoldText]: BoldText as unknown as Constructor<
      BaseComponent<any>
    >,
    [InstanceType.BlockQuote]: Blockquote,
    [InstanceType.ItalicText]: ItalicText as unknown as Constructor<
      BaseComponent<any>
    >,
    [InstanceType.Image]: Image as unknown as Constructor<BaseComponent<any>>,
  };

  /**
   * Mapper that maps the React instance type to the instance type.
   * You can map the React instance type to target instance by combining the
   * reactInstanceMapper and componentMapper together.
   *
   * @see componentMapper
   */
  reactInstanceMapper: { [key: string]: InstanceType } = {
    [ReactInstanceType.Button]: InstanceType.Button,
    [ReactInstanceType.Div]: InstanceType.Container,
    [ReactInstanceType.Text]: InstanceType.Text,
    [ReactInstanceType.Paragraph]: InstanceType.Paragraph,
    [ReactInstanceType.BlockQuote]: InstanceType.BlockQuote,
    [ReactInstanceType.Span]: InstanceType.InlineParagraph,
    [ReactInstanceType.Menu]: InstanceType.Menu,
    [ReactInstanceType.H1]: InstanceType.Header,
    [ReactInstanceType.H2]: InstanceType.Header,
    [ReactInstanceType.H3]: InstanceType.Header,
    [ReactInstanceType.H4]: InstanceType.Header,
    [ReactInstanceType.H5]: InstanceType.Header,
    [ReactInstanceType.H6]: InstanceType.Header,
    [ReactInstanceType.NewLine]: InstanceType.LineBreak,
    [ReactInstanceType.ThematicBreak]: InstanceType.LineBreak,
    [ReactInstanceType.Suspendable]: InstanceType.Suspendable,
    [ReactInstanceType.Link]: InstanceType.Link,
    [ReactInstanceType.Command]: InstanceType.Command,
    [ReactInstanceType.Pre]: InstanceType.Pre,
    [ReactInstanceType.Code]: InstanceType.Code,
    [ReactInstanceType.Bold]: InstanceType.BoldText,
    [ReactInstanceType.Italic]: InstanceType.ItalicText,
    [ReactInstanceType.Img]: InstanceType.Image,
    [ReactInstanceType.Image]: InstanceType.Image,
  };

  build(
    reactInstanceType: ReactInstanceType,
    props: InstanceProps,
    rootContainer: Container<any, any>,
    hostContext: HostContext,
  ): Component {
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
   * Get component from instance type and create the instance out of the component.
   * @param mappedInstanceType
   * @param props
   * @param container
   * @param hostContext
   * @private
   */
  private getComponent(
    mappedInstanceType: InstanceType,
    props: InstanceProps,
    container: Container<any, any>,
    hostContext: HostContext,
  ) {
    const Component = this.componentMapper[mappedInstanceType];
    if (!Component) {
      throw new UnsupportedComponentError(mappedInstanceType);
    }

    // check if the instance has the correct key props
    this.checkIfInstanceHasCorrectKeyProps(mappedInstanceType, props);

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
      throw new UnsupportedReactComponentError(instanceType);
    }
    return mappedInstanceType;
  }

  /**
   * Check if the instance has the correct key props when `onClick` is provided.
   * @param instanceType
   * @param props
   * @private
   */
  private checkIfInstanceHasCorrectKeyProps(
    instanceType: InstanceType,
    props: InstanceProps,
  ) {
    if (props.onClick === undefined) {
      return;
    }

    if (!props.key) {
      throw new MissingRequiredKeyPropsError(instanceType);
    }
  }

  clear() {
    this.reset();
  }

  /**
   * Reset the builder when the new instance is created.
   * @private
   */
  private reset() {
    this.resetKeys();
  }

  private resetKeys() {
    this.keys = [];
  }

  buildFromJson(data: ComponentInterface): Component {
    throw new Error("Method not implemented.");
  }
}
