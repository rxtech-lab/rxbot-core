import { RedirectError } from "@rx-lab/errors";

/**
 * Performs a server-side redirect to a new location.
 *
 * @description
 * This function is designed for server-side use only. It immediately halts execution
 * and initiates a redirect to the specified URL. For client-side redirects,
 * use the `useRouter` hook instead.
 *
 * @param to - The URL to redirect to. This should be a valid relative or absolute URL.
 * @throws {RedirectError} Always throws a RedirectError to be caught by the server runtime.
 * @returns {never} This function never returns as it always throws an error.
 *
 * @example
 * // In a server component or page
 * export default function ServerComponent() {
 *   if (someCondition) {
 *     redirect("/new-location");
 *     // No code after this line will be executed
 *   }
 *   return <div>This will not be rendered if redirected</div>;
 * }
 *
 */
export function redirect(to: string): never {
  throw new RedirectError(to);
}
