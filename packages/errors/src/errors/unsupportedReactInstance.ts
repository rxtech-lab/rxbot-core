import type { ReactInstanceType } from "@rx-lab/common";
import { ErrorCode } from "../errorCode";
import { CustomError } from "./error";

/**
 * Custom error class to indicate
 * that a component is not supported.
 */
export class UnsupportedReactComponentError extends CustomError {
  constructor(instanceType: ReactInstanceType) {
    super(
      `The given react instance type ${instanceType} is not supported.`,
      ErrorCode.UnsupportedReactInstanceType,
    );
  }
}
