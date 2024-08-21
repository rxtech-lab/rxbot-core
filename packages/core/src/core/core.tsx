import path from "path";
import {
  APP_FOLDER,
  type AdapterInterface,
  BaseChatroomInfo,
  BaseMessage,
  type Container,
  CoreApi,
  type InstanceProps,
  InstanceType,
  Logger,
  PageProps,
  type ReactInstanceType,
  RedirectOptions,
  RenderedComponent,
  type Renderer as RendererInterface,
  StorageInterface,
} from "@rx-lab/common";
import { Router } from "@rx-lab/router";
import React from "react";
import type ReactReconciler from "react-reconciler";
import Reconciler from "react-reconciler";
import { Compiler } from "../compiler";
import type { Suspendable } from "../components";
import { type BaseComponent, Text } from "../components";
import { ComponentBuilder } from "../components/builder/componentBuilder";
import { renderServerComponent } from "./server/renderServerComponent";
import { createEmptyFiberRoot } from "./utils";
import { WrappedElement } from "./wrappedElement";

interface RendererOptions {
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
}

type CompileOptions =
  | {
      rootDir: string;
      destinationDir: string;
    }
  | {
      adapter: AdapterInterface<any, any, any>;
      storage: StorageInterface;
      rootDir: string;
      destinationDir: string;
    };

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

export class Core<T extends Container<BaseChatroomInfo, BaseMessage>>
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

  constructor({ adapter, storage }: RendererOptions) {
    const builder = new ComponentBuilder();
    this.adapter = adapter;
    this.storage = storage;
    this.router = new Router({
      adapter: adapter,
      storage: storage,
    });
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
        const hasUpdate = instance.commitUpdate(oldProps, newProps);
        if (instance.isRoot && hasUpdate) {
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

  static async Compile(opts: CompileOptions) {
    let adapter: AdapterInterface<any, any, any>;
    let storage: StorageInterface;

    const compiler = new Compiler({
      rootDir: opts.rootDir,
      destinationDir: opts.destinationDir,
    });
    const routeInfo = await compiler.compile();

    if ("adapter" in opts && "storage" in opts) {
      adapter = opts.adapter;
      storage = opts.storage;
    } else {
      const adapterFile = await require(
        path.join(opts.destinationDir, APP_FOLDER, "adapter"),
      );
      adapter = adapterFile.adapter;
      storage = adapterFile.storage;
    }

    const core = new Core({
      adapter: adapter,
      storage: storage,
    });

    await core.router.initFromRoutes(routeInfo);
    return core;
  }

  /**
   * The core API that provides the necessary methods to render the app.
   */
  get coreApi(): CoreApi<T> {
    return {
      renderApp: (container, callback) => {
        this.listeners.set(this.adapter, callback);
        return this.render(container);
      },
      restoreRoute: async (key) => {
        return await this.router.getRouteFromKey(key);
      },
      redirectTo: async (container, path, options) => {
        await this.redirect(container, path, options);
        return container;
      },
    };
  }

  /**
   * Initialize the renderer.
   */
  async init() {
    // initialize the adapter
    await this.adapter.init(this.coreApi);
    this.adapter.subscribeToMessageChanged(async (container, message) => {
      await this.redirect(container, message, {
        shouldRender: true,
        shouldAddToHistory: true,
      });
    });
    await this.loadAndRenderStoredRoute("/");
  }

  async redirect(container: T, routeOrObject: any, options?: RedirectOptions) {
    const key = this.adapter.getRouteKey(container);
    const route = await this.adapter.decodeRoute(routeOrObject);
    if (route) {
      await this.router.navigateTo(key, route);
      if (options?.shouldAddToHistory) {
        await this.storage.addHistory(key, route);
      }
      delete container.message.text;
    }

    if (options?.shouldRender) {
      await this.loadAndRenderStoredRoute(key);
      await this.render(container);
    }
  }

  async loadAndRenderStoredRoute(key: string) {
    const component = await this.router.render(key);
    await this.setComponent(component);
    return component;
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

    const pageProps: PageProps = {
      searchQuery: this.element.queryString,
      params: this.element.params,
      text: container.message.text,
    };

    const wrappedElement = React.createElement(
      WrappedElement,
      {
        element: this.element,
        storage: this.storage,
        chatroomInfo: container.chatroomInfo,
        message: container.message,
        api: this.coreApi,
      },
      await renderServerComponent(Component, pageProps),
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

  async onDestroy() {
    await this.adapter.onDestroy();
    this.listeners.clear();
  }
}
