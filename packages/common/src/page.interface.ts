import { RouteInfoFile } from "./router.interface";

/**
 * Properties that will be passed to each page component.
 *
 * @example
 * export function Page({ searchQuery }: PageProps) {
 *  return <div>{searchQuery}</div>;
 * }
 */
export interface PageProps {
  searchQuery: Record<string, string | null | boolean>;
  params: Record<string, string>;
  /**
   * The text from user input. May be undefined if the user did not provide any text or
   * the text is treated as a command.
   */
  text?: string;
  /**
   * A file containing information about the routes in the application.
   */
  routeInfoFile: RouteInfoFile;
}
