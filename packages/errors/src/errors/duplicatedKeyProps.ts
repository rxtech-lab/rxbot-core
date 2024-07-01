import { CustomError } from "./error";
import { InstanceType } from "@rx-lab/common";
import { ErrorCode } from "../errorCode";

export class DuplicatedKeyPropsError extends CustomError {
  constructor(instanceType: InstanceType, key: string) {
    super(
      `Duplicated key props for instance type ${instanceType} and key ${key}.`,
      ErrorCode.MissingRequiredKeyProps,
    );
  }
}
