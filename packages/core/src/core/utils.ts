import type { InstanceProps } from "@rx-lab/common";
import React from "react";
import type { FiberRoot, Reconciler } from "react-reconciler";
import { v4 as uuidv4 } from "uuid";

export const createEmptyFiberRoot = (
  container: FiberRoot,
  instance: Reconciler<any, any, any, any, any>,
): FiberRoot => {
  //@ts-expect-error
  container._rootContainer = instance.createContainer(container, false, false);
};

export const isPropsEqual = (
  prevProps: InstanceProps,
  nextProps: InstanceProps,
) => {
  if (prevProps === nextProps) {
    return true;
  }
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  for (let i = 0; i < prevKeys.length; i++) {
    const key = prevKeys[i];
    if (key === undefined) {
      continue;
    }
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  return true;
};

/**
 * Add a unique key to each child element.
 * @param children
 */
export function addKeyToChildren(children: React.ReactNode) {
  if (!React.isValidElement(children)) {
    return children;
  }
  return React.Children.map(children, (child) => {
    let childChildren = (child as React.ReactElement).props.children;
    if (Array.isArray(childChildren)) {
      childChildren = React.Children.map(childChildren, (child) =>
        addKeyToChildren(child),
      );
    }
    return React.cloneElement(child as React.ReactElement, {
      key: child.key ?? uuidv4(),
      children: childChildren,
    });
  });
}
