import { QueryString } from "@rx-lab/common";
import { useContext } from "react";
import { RouterContext } from "../router.context";

/**
 * Hook to get the current search params.
 *
 * @returns{QueryString} The current search params.
 *
 * @example
 *
 * const searchParams = useSearchParams();
 * console.log(searchParams); // { id: "1" }
 */
export function useSearchParams(): QueryString {
  const { query } = useContext(RouterContext);

  return query;
}
