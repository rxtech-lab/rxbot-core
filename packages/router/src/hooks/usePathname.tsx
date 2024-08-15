import { useContext } from "react";
import { RouterContext } from "../router.context";

/**
 * Hook to get the current pathname.
 *
 * @returns The current pathname.
 *
 * @example
 *
 * const path = usePathname();
 * console.log(path); // { path: "/user/1", pathParams: { id: "1" } }
 */
export function usePathname() {
  const { path, pathParams } = useContext(RouterContext);

  return {
    path,
    pathParams,
  };
}
