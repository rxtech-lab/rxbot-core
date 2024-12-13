import type React from "react";

export enum ContainerType {
  ROOT = "ROOT",
}

export interface BaseChatroomInfo {
  id: string | number;
  messageId?: string | number;
  userId: string | number;
}

export interface BaseMessage {
  id: string | number;
  text?: string;
  data?: Record<string, any>;
}

export interface Container<
  ChatroomInfo extends BaseChatroomInfo,
  Message extends BaseMessage,
> {
  children: any[];
  _rootContainer?: React.ReactElement;
  type: string;
  chatroomInfo: ChatroomInfo;
  message?: Message;
  /**
   * If the container's hasUpdated field been set,
   * it means the container has a pending update whether it is resolved or not.
   * When there is a pending update, the adapter should decide whether to update the UI or not.
   */
  hasUpdated?: boolean;
  /**
   * A boolean value indicating whether the message is from a group chat.
   */
  isInGroup: boolean;

  /**
   * Group id of the chatroom.
   */
  groupId?: string;

  /**
   * True if the message was invoked by a user's mention, false otherwise.
   * For example, in `Telegram`, if user type `@bot_name`, the bot will be mentioned.
   */
  hasBeenMentioned: boolean;
}
