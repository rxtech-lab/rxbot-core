import type { FiberRoot, Reconciler } from "react-reconciler";
import type { InstanceProps } from "@rx-lab/common";

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
