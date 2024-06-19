import Reconciler from "react-reconciler";
import { createEmptyFiberRoot } from "./utils";
import {
  Container,
  InstanceProps,
  Renderer,
  ReactInstanceType,
} from "@rx-bot/common";
import React from "react";
import { Component, Text } from "./components";
import { ComponentBuilder } from "./builder/componentBuilder";

export class BaseRenderer<T extends Container> implements Renderer<T> {
  reconciler: Reconciler.Reconciler<Container, Component, any, any, any>;

  constructor() {
    const builder = new ComponentBuilder();

    const hostConfig: Reconciler.HostConfig<
      ReactInstanceType,
      InstanceProps,
      Container,
      Component,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    > = {
      //@ts-expect-error
      now: Date.now,
      supportsMutation: true,
      getRootHostContext: () => ({}),
      getChildHostContext: () => ({}),
      prepareForCommit: () => null,
      resetAfterCommit: () => {},
      // Creating an instance of the host element
      createInstance(
        type: ReactInstanceType,
        props: InstanceProps,
        rootContainer: Container,
        hostContext: any,
        internalHandle: Reconciler.OpaqueHandle,
      ): Component {
        return builder.build(type, props, rootContainer, hostContext);
      },
      appendInitialChild: (parent, child) => {
        parent.children.push(child);
      },
      appendAllChildren: () => {},
      finalizeInitialChildren: (
        instance,
        type,
        props,
        rootContainer,
        hostContext,
      ) => {
        instance.finalizeBeforeMount();
        return false;
      },
      appendChildToContainer: (container, child) => {
        container.children.push(child);
      },
      prepareUpdate: () => true,
      shouldSetTextContent: () => false,
      createTextInstance: (text, rootContainer, hostContext, internalHandle) =>
        new Text({
          text: text,
          context: hostContext,
          container: rootContainer,
          internalInstanceHandle: internalHandle,
        }),
      // Update functions
      appendChild: (parent, child) => {
        parent.appendChild(child);
      },
      clearContainer: () => {},
      removeChild: (parent, child) => {
        parent.removeChild(child);
      },
      insertBefore: (parent, child, beforeChild) => {
        parent.insertBefore(child, beforeChild);
      },
      commitUpdate: (instance, updatePayload, type, oldProps, newProps) => {
        instance.props = newProps;
      },
      commitTextUpdate: (textInstance, oldText, newText) => {
        textInstance.props.nodeValue = newText;
      },
      resetTextContent: () => {},
    };

    this.reconciler = Reconciler(hostConfig);
  }
  async onRendered(container: T) {}
  async init() {}
  render(element: React.ReactElement, container: T) {
    if (!container._rootContainer) {
      createEmptyFiberRoot(container, this.reconciler);
    }
    this.reconciler.updateContainer(
      element,
      container._rootContainer,
      null,
      async () => {
        await this.onRendered(container);
      },
    );
  }
}
