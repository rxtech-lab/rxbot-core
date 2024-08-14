/**
 * Convert a route to a Telegram route.
 * Replace any slash after the first slash with a underscore.
 *
 * For example:
 * /home -> /home
 * /settings/profile/edit -> /settings_profile_edit
 * /settings/profile -> /settings_profile
 * @param route
 */
export function convertRouteToTGRoute(route: string): string {
  // Check if the route starts with a slash
  if (!route.startsWith("/")) {
    return route; // Return unchanged if it doesn't start with a slash
  }

  // Find the position of the second slash
  const secondSlashIndex = route.indexOf("/", 1);

  // If there's no second slash, return the route as is
  if (secondSlashIndex === -1) {
    return route;
  }

  // Replace all slashes after the first one with underscores
  return (
    route.substring(0, secondSlashIndex) +
    route.substring(secondSlashIndex).replace(/\//g, "_")
  );
}

/**
 * Convert a Telegram route back to a regular route.
 * Replace any underscore after the first slash with a slash.
 *
 * @param route The Telegram route to convert
 * @returns The converted regular route
 *
 * @example
 * convertTGRouteToRoute('/home') // returns '/home'
 * convertTGRouteToRoute('/settings_profile_edit') // returns '/settings/profile/edit'
 * convertTGRouteToRoute('/settings_profile') // returns '/settings/profile'
 */
export function convertTGRouteToRoute(route: string): string {
  // Check if the route starts with a slash
  if (!route.startsWith("/")) {
    return route; // Return unchanged if it doesn't start with a slash
  }

  // Find the position of the first underscore
  const firstUnderscoreIndex = route.indexOf("_");

  // If there's no underscore, return the route as is
  if (firstUnderscoreIndex === -1) {
    return route;
  }

  // Replace all underscores after the first slash with slashes
  return (
    route.substring(0, firstUnderscoreIndex) +
    route.substring(firstUnderscoreIndex).replace(/_/g, "/")
  );
}
