import { RouterProvider } from "./router.context";

export function isRouterComponent(ComponentType: any) {
  return ComponentType === RouterProvider && ComponentType.isRouterComponent;
}
