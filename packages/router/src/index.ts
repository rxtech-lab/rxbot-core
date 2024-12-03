export { RouterProvider, RouterContext, useRouter } from "./router.context";
export { isRouterContextComponent } from "./router.context.utils";
export { queryStringify, parseQuery } from "./router.utils";
export {
  Router,
  importRoute,
  matchSpecialRouteWithPath,
  matchRouteWithPath,
} from "./router";
export { redirect } from "./redirect";

interface SuspendableProps {
  children: any;
  shouldSuspend: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      suspendable: SuspendableProps;
    }
  }
}
