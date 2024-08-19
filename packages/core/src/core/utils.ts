import type { InstanceProps } from "@rx-lab/common";
import type { FiberRoot, Reconciler } from "react-reconciler";

export const createEmptyFiberRoot = (
  container: FiberRoot,
  instance: Reconciler<any, any, any, any, any>,
): FiberRoot => {
  //@ts-expect-error
  container._rootContainer = instance.createContainer(container, false, false);
};

/**
 * Compare two props objects for equality
 * @param prevProps Props object
 * @param nextProps Props object
 *
 * @returns boolean indicating whether the props are equal
 */
export const isPropsEqual = (
  prevProps: InstanceProps,
  nextProps: InstanceProps,
): boolean => {
  if ((prevProps as any).elementType === "suspendable") {
    console.log("prevProps", prevProps);
  }

  try {
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
      if (!isValueEqual(prevProps[key], nextProps[key])) {
        return false;
      }
    }
    return true;
  } catch (e) {
    console.log(e);
    console.log("Error", prevProps, nextProps);
    throw e;
  }
};

const isValueEqual = (a: any, b: any): boolean => {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return isArrayEqual(a, b);
  }
  if (isObject(a) && isObject(b)) {
    return Object.is(a, b);
  }

  if (isFunction(a) && isFunction(b)) {
    return isFunctionEqual(a, b);
  }

  return false;
};

const isArrayEqual = (a: any[], b: any[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!isValueEqual(a[i], b[i])) {
      return false;
    }
  }
  return true;
};

const isObject = (value: any): boolean => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isFunction = (value: any): boolean => {
  return typeof value === "function";
};

const isFunctionEqual = (a: any, b: any): boolean => {
  return a.toString() === b.toString();
};
