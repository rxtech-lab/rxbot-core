import { RouterProvider } from "./router.context";

export function isRouterContextComponent(ComponentType: any) {
  return ComponentType === RouterProvider && ComponentType.isRouterComponent;
}
