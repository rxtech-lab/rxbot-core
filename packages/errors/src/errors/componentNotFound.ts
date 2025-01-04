import { ErrorCode } from "../errorCode";
import { CustomError } from "./error";

export class ComponentNotFound extends CustomError {
  constructor() {
    super(`Component not found`, ErrorCode.ComponentIsNotFunction);
  }
}
