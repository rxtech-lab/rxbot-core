import {
  type AdapterInterface,
  type Container,
  CoreApi,
  type InstanceProps,
  InstanceType,
  Logger,
  type ReactInstanceType,
  RenderedComponent,
  type Renderer as RendererInterface,
  StorageInterface,
} from "@rx-lab/common";
import { Router } from "@rx-lab/router";
import React from "react";
import type ReactReconciler from "react-reconciler";
import Reconciler from "react-reconciler";
import type { Suspendable } from "../components";
import { type BaseComponent, Text } from "../components";
import { ComponentBuilder } from "../components/builder/componentBuilder";
import { renderServerComponent } from "./server/renderServerComponent";
import { createEmptyFiberRoot } from "./utils";
import { WrappedElement } from "./wrappedElement";

interface RendererOptions {
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
  router: Router;
}

// recursively find the first suspendable instance
function getSuspendableInstance(
  children: BaseComponent<any>[],
): Suspendable | undefined {
  for (const child of children) {
    if (child.type === InstanceType.Suspendable) {
      return child;
    }
    if (child.children.length > 0) {
      return getSuspendableInstance(child.children);
    }
  }
}

export class Core<T extends Container<any, any>>
  implements RendererInterface<T>
{
  reconciler: Reconciler.Reconciler<
    Container<any, any>,
    BaseComponent<any>,
    any,
    any,
    any
  >;
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
  router: Router;
  private element: RenderedComponent | undefined;

  listeners: Map<
    AdapterInterface<any, any, any>,
    (container: T) => Promise<void>
  > = new Map();

  constructor({ adapter, storage, router }: RendererOptions) {
    const builder = new ComponentBuilder();
    this.adapter = adapter;
    this.storage = storage;
    this.router = router;
    const hostConfig: Reconciler.HostConfig<
      ReactInstanceType,
      InstanceProps,
      Container<any, any>,
      BaseComponent<any>,
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
        rootContainer: Container<any, any>,
        hostContext: any,
        internalHandle: Reconciler.OpaqueHandle,
      ): BaseComponent<any> {
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
      commitMount(
        instance: BaseComponent<any>,
        type: ReactInstanceType,
        props: InstanceProps,
        internalInstanceHandle: ReactReconciler.OpaqueHandle,
      ) {},

      appendChildToContainer: (container, child: BaseComponent<any>) => {
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
          await this.onUpdate(instance.parent as any);
        }
      },
      commitTextUpdate: (textInstance, oldText, newText) => {
        textInstance.props.nodeValue = newText;
      },
      resetTextContent: () => {},
      detachDeletedInstance(node: BaseComponent<any>) {},
      removeChildFromContainer(container: Container<any, any>, child: any) {},
    };

    this.reconciler = Reconciler(hostConfig);
  }

  /**
   * The core API that provides the necessary methods to render the app.
   */
  get coreApi(): CoreApi<any> {
    return {
      renderApp: (container, callback) => {
        this.listeners.set(this.adapter, callback);
        return this.render(container);
      },
      redirectTo: async (container, path, options) => {
        // store the new path
        const key = this.adapter.getRouteKey(container);
        await this.router.navigateTo(key, path);
        if (options.shouldRender) {
          await this.loadAndRenderStoredRoute(key);
          await this.render(container);
        }
      },
    };
  }

  /**
   * Initialize the renderer.
   */
  async init() {
    // initialize the adapter
    await this.adapter.init(this.coreApi);
  }

  async loadAndRenderStoredRoute(key: string) {
    const component = await this.router.render(key);
    await this.setComponent(component);
  }

  /**
   * Set the component to render.
   * @param component Must be a valid client component.
   */
  private async setComponent(component: RenderedComponent) {
    this.element = component;
  }

  /**
   * Check if the render is suspended.
   * @param container
   * @private
   */
  private isSuspended(container: T) {
    const suspendableInstance = getSuspendableInstance(
      container?.children ?? [],
    );
    if (!suspendableInstance) {
      throw new Error("No suspendable instance found");
    }

    if (suspendableInstance.props.shouldSuspend) {
      Logger.log(`Render is suspended`);
      return true;
    }

    return false;
  }

  /**
   * Helper function to render the app asynchronously.
   * @param container The container to render the app in
   * @private
   */
  async render(container: T) {
    if (!this.element) {
      throw new Error("No component to render");
    }

    if (!container._rootContainer) {
      createEmptyFiberRoot(container, this.reconciler);
    }

    // wrap the element with the router and storage providers so that
    // the components can access the router and storage
    const Component = this.element.component;

    const props = {};

    const wrappedElement = React.createElement(
      WrappedElement,
      {
        element: this.element,
        storage: this.storage,
        chatroomInfo: container.chatroomInfo,
        message: container.message,
        api: this.coreApi,
      },
      await renderServerComponent(Component, props),
    );

    await new Promise<void>((resolve) => {
      this.reconciler.updateContainer(
        wrappedElement,
        container._rootContainer,
        null,
        async () => {
          await this.adapter.componentOnMount(container);
          resolve();
        },
      );
    });

    return container;
  }

  /**
   * Update the container to reflect the changes within the UI.
   * @param container
   */
  private async update(container: T) {
    if (this.isSuspended(container)) {
      return;
    }
    await this.adapter.adapt(container, true);
  }

  async onUpdate(container: T) {
    await this.update(container);

    for (const listener of this.listeners.values()) {
      await listener(container);
    }
  }
}
