import Reconciler from "react-reconciler";
import { createEmptyFiberRoot } from "./utils";
import {
  Container,
  InstanceProps,
  Renderer,
  InstanceType,
  ReactInstanceType,
} from "@rx-bot/common";
import React from "react";

const hostConfig = {
  now: Date.now,
  supportsMutation: true,
  getRootHostContext: () => ({}),
  getChildHostContext: () => ({}),
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  // Creating an instance of the host element
  createInstance: (type: ReactInstanceType, props: InstanceProps) => ({
    type,
    props,
    children: [],
  }),
  //@ts-expect-error
  appendInitialChild: (parent, child) => {
    parent.children.push(child);
  },
  appendAllChildren: () => {},
  finalizeInitialChildren: () => false,
  //@ts-expect-error
  appendChildToContainer: (container, child) => {
    container.children.push(child);
  },
  prepareUpdate: () => true,
  shouldSetTextContent: () => false,
  //@ts-expect-error
  createTextInstance: (text) => ({
    type: "TEXT_ELEMENT",
    props: { nodeValue: text },
  }),

  // Update functions
  //@ts-expect-error
  appendChild: (parent, child) => {
    parent.children.push(child);
  },
  clearContainer: () => {},
  //@ts-expect-error
  removeChild: (parent, child) => {
    //@ts-expect-error
    parent.children = parent.children.filter((c) => c !== child);
  },
  //@ts-expect-error
  insertBefore: (parent, child, beforeChild) => {
    const index = parent.children.indexOf(beforeChild);
    parent.children.splice(index, 0, child);
  },
  //@ts-expect-error
  commitUpdate: (instance, updatePayload, type, oldProps, newProps) => {
    instance.props = newProps;
  },
  //@ts-expect-error
  commitTextUpdate: (textInstance, oldText, newText) => {
    textInstance.props.nodeValue = newText;
  },
  resetTextContent: () => {},
};

//@ts-expect-error
const ReconcilerInstance = Reconciler(hostConfig);

export abstract class BaseRenderer<T extends Container> implements Renderer<T> {
  async onRendered(container: T) {}
  async init() {}
  render(element: React.ReactElement, container: T) {
    if (!container._rootContainer) {
      createEmptyFiberRoot(container, ReconcilerInstance);
    }
    ReconcilerInstance.updateContainer(
      element,
      container._rootContainer,
      null,
      async () => {
        await this.onRendered(container);
      },
    );
  }
}
