type AsyncFunction = Promise<unknown>;

/**
 * Wait until the async function is resolved.
 * This is a platform-specific function that will be compiled to different code based on the platform.
 * For example, when build for vercel deployment, this function will use `@vercel/functions` under the hood.
 * @param asyncFunc
 */
export function waitUntil(asyncFunc: AsyncFunction) {
  return asyncFunc;
}
