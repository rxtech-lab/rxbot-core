import { ErrorCode } from "../errorCode";
import { CustomError } from "./error";
import { InstanceType, ReactInstanceType } from "@rx-bot/common";

/**
 * Custom error class to indicate
 * that a component is not supported.
 */
export class UnsupportedComponentError extends CustomError {
  constructor(instanceType: InstanceType | ReactInstanceType) {
    super(
      `The given instance type ${instanceType} is not supported.`,
      ErrorCode.UnsupportedComponent,
    );
  }
}
