import type { InstanceType } from "@rx-lab/common";
import { ErrorCode } from "../errorCode";
import { CustomError } from "./error";

export class DuplicatedKeyPropsError extends CustomError {
  constructor(instanceType: InstanceType, key: string) {
    super(
      `Duplicated key props for instance type ${instanceType} and key ${key}.`,
      ErrorCode.DuplicateKeyProps,
    );
  }
}
