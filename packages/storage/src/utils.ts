export function encodeStateKey(
  chatroomId: string | number,
  messageId: string | number,
  key: string,
): string {
  return `${chatroomId}-${messageId}-${key}`;
}
