import { StateScope } from "./state";

export function encodeStateKey(
  chatroomId: string | number,
  messageId: string | number,
  key: string,
  scope?: StateScope,
): string {
  if (scope === "chatroom") {
    return `${chatroomId}-${key}`;
  }
  // Default to message scope
  return `${chatroomId}-${messageId}-${key}`;
}
