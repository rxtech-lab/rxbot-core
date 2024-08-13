/**
 * Matches a route pattern against a pathname and extracts dynamic parameters.
 *
 * @param routePattern - The route pattern to match against. It can include dynamic segments
 *                       enclosed in square brackets, e.g., '/user/[id]'.
 * @param pathname - The actual pathname to match, e.g., '/user/123'.
 *
 * @returns If the pathname matches the routePattern, it returns a Record object where
 *          keys are the names of dynamic segments and values are the corresponding
 *          parts of the pathname. If there's no match, it returns null.
 *
 * @example
 * // returns { id: '123' }
 * matchRoute('/user/[id]', '/user/123');
 *
 * @example
 * // returns { category: 'books', id: '456' }
 * matchRoute('/[category]/[id]', '/books/456');
 *
 * @example
 * // returns null
 * matchRoute('/user/[id]', '/blog/post');
 *
 * @example
 * // returns {} (empty object, as there are no dynamic segments)
 * matchRoute('/about', '/about');
 */
export function matchRoute(
  routePattern: string,
  pathname: string,
): Record<string, string> | null {
  const routeParts = routePattern.split("/");
  const pathParts = pathname.split("/");

  if (routeParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const pathPart = pathParts[i];

    if (routePart.startsWith("[") && routePart.endsWith("]")) {
      const paramName = routePart.slice(1, -1);
      params[paramName] = pathPart;
    } else if (routePart !== pathPart) {
      return null;
    }
  }

  return params;
}

/**
 * Parses a URL search string into a key-value pair object.
 *
 * @param search - The search string from a URL, typically everything after the '?' character.
 *                 It should not include the '?' itself.
 *
 * @returns A Record object where keys are the parameter names and values are the parameter values.
 *          Both keys and values are decoded from their URL-encoded form.
 *
 * @example
 * // returns { page: '1', sort: 'desc' }
 * parseQuery('page=1&sort=desc');
 *
 * @example
 * // returns { query: 'hello world' }
 * parseQuery('query=hello%20world');
 */
export function parseQuery(search: string): Record<string, string> {
  if (!search) return {};
  const params = new URLSearchParams(search);
  const query: Record<string, string> = {};
  for (const [key, value] of params) {
    query[key] = value;
  }
  return query;
}

/**
 * Converts a record of key-value pairs into a URL query string.
 * @param params An object containing key-value pairs to be converted into a query string.
 * @returns A URL-encoded query string.
 *
 * @example
 * // returns '?page=1&sort=desc'
 * queryStringify({ page: 1, sort: 'desc' });
 *
 * @example
 * // returns '?query=hello%20world'
 * queryStringify({ query: 'hello world' });
 */
export function queryStringify(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(String(value));
      parts.push(`${encodedKey}=${encodedValue}`);
    }
  }

  return parts.length > 0 ? `?${parts.join("&")}` : "";
}
