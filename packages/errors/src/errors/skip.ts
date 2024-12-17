import { ErrorCode } from "../errorCode";
import { CustomError } from "./error";

/**
 * Represents an error thrown when a page's rendering should be skipped for the current request.
 * This is typically used in middleware or routing logic to indicate that the regular page
 * rendering flow should be bypassed without treating it as a failure condition.
 *
 * @throws {SkipError} When the page rendering should be skipped
 * @extends {CustomError}
 */
export class SkipError extends CustomError {
  constructor() {
    super("Skip error", ErrorCode.Skip);
  }
}
