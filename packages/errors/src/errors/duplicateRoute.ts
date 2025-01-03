import { ErrorCode } from "../errorCode";
import { CustomError } from "./error";

export class DuplicateRouteError extends CustomError {
  constructor(route: string) {
    super(
      `Conflict: the given route already exists: ${route}`,
      ErrorCode.DuplicateRoute,
    );
  }
}
