import type { ErrorCode } from "../errorCode";

export class CustomError extends Error {
  code: ErrorCode;
  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }

  getErrorCode(): ErrorCode {
    return this.code;
  }
}
