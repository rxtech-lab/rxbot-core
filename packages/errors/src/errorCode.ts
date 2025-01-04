/**
 * Generic error codes
 * 0-1000: Error maps to 400
 * 1001-2000: Error maps to 401
 * 2001-3000: Error maps to 403
 * 3001-4000: Error maps to 404
 * 4000-5000: Error maps to 500
 * 6000-7000: Error maps to 503
 * 7000-8000: Error maps to 504
 * 8000-9000: Error maps to 300-399
 */
export enum ErrorCode {
  UnsupportedComponent = 1001,
  UnsupportedReactInstanceType = 1002,
  MissingRequiredKeyProps = 1003,
  DuplicateKeyProps = 1004,
  // Redirect
  RedirectToNewLocation = 1005,
  // Skip
  Skip = 1006,
  DuplicateRoute = 1007,
  ComponentIsNotFunction = 3000,
}
