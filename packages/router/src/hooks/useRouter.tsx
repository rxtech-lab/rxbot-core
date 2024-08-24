import { RedirectOptions } from "@rx-lab/common";
import { useCallback, useContext } from "react";
import { RouterContext } from "../router.context";

/**
 * Use this hook to interact with the router in your components.
 * This hook provides access to the `redirectTo` function, which can be used to
 * redirect to a new location.
 *
 * @example
 * const { redirectTo } = useRouter();
 * await redirectTo("/new-location");
 *
 * @example
 * const { redirectTo } = useRouter();
 * await redirectTo("/new-location", { shouldRender: true });
 */
export function useRouter() {
  const { coreApi, message } = useContext(RouterContext);

  /**
   * Redirects to a new location with the given options.
   *
   * @param path{string} - The URL to redirect to. This should be a valid relative or absolute URL.
   * @param options{RedirectOptions} - Optional redirect options.
   */
  const redirectTo = useCallback(
    async (path: string, options?: RedirectOptions) => {
      await coreApi.redirectToWithMessage(
        message,
        path,
        options ?? {
          shouldRender: true,
          shouldAddToHistory: true,
        },
      );
    },
    [coreApi, message],
  );

  return {
    redirectTo,
  };
}
