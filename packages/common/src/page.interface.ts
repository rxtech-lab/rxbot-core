import { RouteInfoFile } from "./router.interface";
import { StorageClientInterface } from "./storage.interface";
import type { ReactNode } from "react";

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
   *
   * This field also been used when bot wants to send message to the user.
   */
  data?: Record<string, any>;
  /**
   * The user ID of the user who sent the message.
   */
  userId: string | number;
  /**
   * A file containing information about the routes in the application.
   */
  routeInfoFile: RouteInfoFile;
  /**
   * The storage object used for storing and retrieving data. This is typically instantiated within the `useState` hook,
   * but when working with server components, it can be used as an alternative means to manage state.
   */
  storage: StorageClientInterface;

  /**
   * A boolean value indicating whether the message is from a group chat.
   */
  isInGroup: boolean;

  /**
   * True if the message was invoked by a user's mention, false otherwise.
   * For example, in `Telegram`, if user type `@bot_name`, the bot will be mentioned.
   */
  hasBeenMentioned: boolean;

  /**
   * Group id of the chatroom.
   */
  groupId?: string;

  /**
   * The message id of the current message.
   */
  messageId: string;

  /**
   * The chatroom id of the current chatroom.
   */
  chatroomId: string;
}

export interface ErrorPageProps {
  error: Error;
  code?: number;
}

export interface NotFoundPageProps {
  message?: string;
}

/**
 * Properties that will be passed to layout components.
 * Layout components must accept children as they wrap other components.
 */
export interface LayoutProps {
  children: ReactNode;
}
