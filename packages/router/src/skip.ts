import { SkipError } from "@rx-lab/errors";

/**
 * Immediately terminates the current render operation and triggers a new render.
 * Useful for handling conditional rendering flows or invalidating the current render pass.
 *
 * Note: This operation can only be called during render, and will throw an error if called
 * during event handlers or effects.
 *
 * @throws {Error} If called outside of component render
 *
 * @example
 * ```tsx
 * export default function Page() {
 *   if (shouldSkip) {
 *     skip(); // Abandon current render and start fresh
 *   }
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export function skip() {
  throw new SkipError();
}
