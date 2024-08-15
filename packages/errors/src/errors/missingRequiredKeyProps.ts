import type { InstanceType } from "@rx-lab/common";
import { ErrorCode } from "../errorCode";
import { CustomError } from "./error";

export class MissingRequiredKeyPropsError extends CustomError {
  constructor(instanceType: InstanceType) {
    super(
      `Missing required key props for instance type ${instanceType}. 
      You need to provide the required key props when defining the instance with onClick prop.`,
      ErrorCode.MissingRequiredKeyProps,
    );
  }
}
