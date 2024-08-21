import type React from "react";

export enum ContainerType {
  ROOT = "ROOT",
}

export interface BaseChatroomInfo {
  id: string | number;
  messageId?: string | number;
}

export interface BaseMessage {
  id: string | number;
  text?: string;
}

export interface Container<
  ChatroomInfo extends BaseChatroomInfo,
  Message extends BaseMessage,
> {
  children: any[];
  _rootContainer?: React.ReactElement;
  type: string;
  chatroomInfo: ChatroomInfo;
  message: Message;
  /**
   * If the container's hasUpdated field been set,
   * it means the container has a pending update whether it is resolved or not.
   * When there is a pending update, the adapter should decide whether to update the UI or not.
   */
  hasUpdated?: boolean;
}
