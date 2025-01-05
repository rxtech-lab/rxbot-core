import { CustomError } from "./error";
import { ErrorCode } from "../errorCode";

export class AuthorizationError extends CustomError {
  constructor(message: string) {
    super(message, ErrorCode.AuthorizationFailure);
  }
}
