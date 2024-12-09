import {
  AdapterInterface,
  BaseChatroomInfo,
  BaseMessage,
  Container,
  type InstanceProps,
  InstanceType,
  Logger,
  type ReactInstanceType,
  StorageInterface,
} from "@rx-lab/common";
import { Router } from "@rx-lab/router";
import { DebouncedFunc, debounce } from "lodash";
import type ReactReconciler from "react-reconciler";
import Reconciler from "react-reconciler";
import { BaseComponent, Suspendable, Text } from "../components";
import { ComponentBuilder } from "../components/builder/componentBuilder";
import { DEFAULT_DEBOUNCE_RENDERING_TIME, DEFAULT_TIMEOUT } from "./configs";
import { TypedEventEmitter } from "./typedListener";

interface RendererOptions {
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
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

type ServerEvents = {
  [K: string]: (...args: any[]) => void;
} & {
  update: <T extends Container<BaseChatroomInfo, BaseMessage>>(
    container: T,
  ) => void;
  startRenderCallback: () => void;
  endRenderCallback: () => void;
};

export class Renderer<
  T extends Container<BaseChatroomInfo, BaseMessage>,
> extends TypedEventEmitter<ServerEvents> {
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
  /**
   * Tracks the timestamp of the last commitUpdate call.
   * This is used to determine when the UI has settled after a message update.
   * It's updated in the commitUpdate method of the host config.
   *
   * @example
   * this.lastCommitUpdateTime = Date.now();
   */
  protected lastCommitUpdateTime = 0;
  /**
   * Holds the resolve function for the Promise returned by handleMessageUpdate.
   * This allows us to resolve the Promise when we determine that no more
   * commitUpdates have occurred for a specified period (2 seconds).
   * It's set in handleMessageUpdate and used in the checkCommitUpdates function.
   */
  protected handleMessageUpdateResolver: (() => void) | null = null;

  /**
   * Debounced version of the adapt function.
   */
  protected debouncedAdapt: DebouncedFunc<(container: T) => Promise<void>>;

  constructor({ adapter, storage }: RendererOptions) {
    super();
    const builder = new ComponentBuilder();
    this.adapter = adapter;
    this.storage = storage;
    this.router = new Router({
      adapter: adapter,
      storage: storage,
    });
    this.debouncedAdapt = debounce(
      async (container: T) => {
        Logger.log("Executing debounced adapt");
        await this.adapter.adapt(container, true);
      },
      DEFAULT_DEBOUNCE_RENDERING_TIME,
      {
        leading: false, // Don't execute on the leading edge
        trailing: true, // Execute on the trailing edge
        maxWait: DEFAULT_TIMEOUT, // Maximum time to wait before forcing execution
      },
    );
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
      isPrimaryRenderer: true,
      scheduleMicrotask:
        typeof queueMicrotask === "function" ? queueMicrotask : setTimeout,
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
          this.lastCommitUpdateTime = Date.now();
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
   * Update the container to reflect the changes within the UI.
   * @param container
   */
  private async update(container: T): Promise<void> {
    if (this.isSuspended(container)) {
      return;
    }

    // create a deep copy of the container
    // since if the container is updated while debouncing
    // the debounced function will use the updated container not the old one
    await this.debouncedAdapt(container);
  }

  async onUpdate(container: T) {
    await this.update(container);
    if (container.hasUpdated || container.hasUpdated === undefined) {
      return;
    }

    if (container.children[0].props.shouldSuspend) {
      return;
    }
    this.emit("update", container);
  }
}
