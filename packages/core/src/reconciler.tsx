import Reconciler from "react-reconciler";
import { createEmptyFiberRoot } from "./utils";
import {
  Container,
  InstanceProps,
  Renderer as RendererInterface,
  ReactInstanceType,
  AdapterInterface,
} from "@rx-bot/common";
import React from "react";
import { Component, Text } from "./components";
import { ComponentBuilder } from "./builder/componentBuilder";

interface RendererOptions {
  adapter: AdapterInterface<any, any>;
}

export class Renderer<T extends Container> implements RendererInterface<T> {
  reconciler: Reconciler.Reconciler<Container, Component, any, any, any>;
  adapter: AdapterInterface<any, any>;
  private hasMountedAdapter: boolean = false;

  constructor({ adapter }: RendererOptions) {
    const builder = new ComponentBuilder();
    this.adapter = adapter;
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
        try {
          return builder.build(
            type,
            {
              ...props,
              key: internalHandle.key,
            },
            rootContainer,
            hostContext,
          );
        } catch (e) {
          console.error(e);
          return new Text({
            internalInstanceHandle: internalHandle,
            container: rootContainer,
            context: hostContext,
            text: "Unsupported component",
          });
        }
      },
      appendInitialChild: (parent, child) => {
        parent.appendChild(child);
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
      appendChildToContainer: (container, child: Component) => {
        child.appendAsContainerChildren(container);
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
      clearContainer: () => {
        builder.clear();
      },
      removeChild: (parent, child) => {
        parent.removeChild(child);
      },
      insertBefore: (parent, child, beforeChild) => {
        parent.insertBefore(child, beforeChild);
      },
      commitUpdate: async (
        instance,
        updatePayload,
        type,
        oldProps,
        newProps,
        internalHandle,
      ) => {
        instance.commitUpdate(oldProps, newProps);
        if (instance.isRoot) {
          await this.update(instance.parent as any);
        }
      },
      commitTextUpdate: (textInstance, oldText, newText) => {
        textInstance.props.nodeValue = newText;
      },
      resetTextContent: () => {},
    };

    this.reconciler = Reconciler(hostConfig);
  }

  async init() {
    await this.adapter.init();
  }

  /**
   * Render the element to the corresponding adapter.
   * @param element
   * @param container
   */
  async render(element: React.ReactElement, container: T) {
    if (!container._rootContainer) {
      createEmptyFiberRoot(container, this.reconciler);
    }

    await new Promise<void>((resolve) => {
      this.reconciler.updateContainer(
        element,
        container._rootContainer,
        null,
        async () => {
          if (!this.hasMountedAdapter) {
            await this.adapter.componentOnMount(container);
          }
          resolve();
        },
      );
    });
    this.hasMountedAdapter = true;
    return await this.adapter.adapt(container, false);
  }

  /**
   * Update the container to reflect the changes.
   * @param container
   */
  async update(container: T) {
    await this.adapter.adapt(container, true);
  }
}
