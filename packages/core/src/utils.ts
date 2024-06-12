import { FiberRoot, Reconciler } from "react-reconciler";

export const createEmptyFiberRoot = (
  container: FiberRoot,
  instance: Reconciler<any, any, any, any, any>,
): FiberRoot => {
  //@ts-expect-error
  container._rootContainer = instance.createContainer(container, false, false);
};
