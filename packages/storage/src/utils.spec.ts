import { encodeStateKey } from "./utils";

describe("encodeStateKey", () => {
  it("should be able to encode message scope", () => {
    const key = encodeStateKey(1, 2, "key");
    expect(key).toBe("1-2-key");
  });

  it("should be able to encode chatroom scope", () => {
    const key = encodeStateKey(1, 2, "key", "chatroom");
    expect(key).toBe("1-key");
  });

  it("should be able to encode default scope", () => {
    const key = encodeStateKey(1, 2, "key");
    expect(key).toBe("1-2-key");
  });
});
