import { StateScope } from "@rx-lab/common";

export function encodeStateKey(
  chatroomId: string | number,
  messageId: string | number | undefined,
  key: string,
  scope?: StateScope,
): string {
  if (scope === "chatroom") {
    return `${chatroomId}-${key}`;
  }
  // Default to message scope
  return `${chatroomId}-${messageId}-${key}`;
}
