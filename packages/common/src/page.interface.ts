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
   * Data is a json like object that can be passed from the adapter.
   * For example, if you are building a web app in telegram, then
   * this data represents the data you passed through `window.Telegram.WebApp.sendData(JSON.stringify(YOUR_DATA));`.
   */
  data?: Record<string, any>;
  /**
   * A file containing information about the routes in the application.
   */
  routeInfoFile: RouteInfoFile;
}

export interface ErrorPageProps {
  error: Error;
  code: number;
}
