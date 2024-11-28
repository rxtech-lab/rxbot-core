import { TypedEventEmitter } from "./typedListener";

// Define the event types for testing
type TestEvents = {
  userJoined: (userId: string, timestamp: number) => void;
  messageReceived: (message: string) => void;
  statusUpdate: (online: boolean) => void;
};

describe("TypedEventEmitter", () => {
  let emitter: TypedEventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new TypedEventEmitter<TestEvents>();
  });

  describe("on and emit", () => {
    it("should properly handle events with multiple parameters", () => {
      const mockHandler = jest.fn();
      emitter.on("userJoined", mockHandler);

      const userId = "user123";
      const timestamp = Date.now();
      emitter.emit("userJoined", userId, timestamp);

      expect(mockHandler).toHaveBeenCalledWith(userId, timestamp);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple handlers for the same event", () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();

      emitter.on("messageReceived", mockHandler1);
      emitter.on("messageReceived", mockHandler2);

      const message = "Hello, World!";
      emitter.emit("messageReceived", message);

      expect(mockHandler1).toHaveBeenCalledWith(message);
      expect(mockHandler2).toHaveBeenCalledWith(message);
      expect(mockHandler1).toHaveBeenCalledTimes(1);
      expect(mockHandler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("once", () => {
    it("should only trigger the handler once", () => {
      const mockHandler = jest.fn();
      emitter.once("statusUpdate", mockHandler);

      emitter.emit("statusUpdate", true);
      emitter.emit("statusUpdate", false);
      emitter.emit("statusUpdate", true);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(true);
    });
  });

  describe("off", () => {
    it("should remove a specific handler", () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();

      emitter.on("messageReceived", mockHandler1);
      emitter.on("messageReceived", mockHandler2);

      emitter.off("messageReceived", mockHandler1);
      emitter.emit("messageReceived", "test");

      expect(mockHandler1).not.toHaveBeenCalled();
      expect(mockHandler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeAllListeners", () => {
    it("should remove all listeners for a specific event", () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();
      const mockHandler3 = jest.fn();

      emitter.on("messageReceived", mockHandler1);
      emitter.on("messageReceived", mockHandler2);
      emitter.on("statusUpdate", mockHandler3);

      emitter.removeAllListeners("messageReceived");

      emitter.emit("messageReceived", "test");
      emitter.emit("statusUpdate", true);

      expect(mockHandler1).not.toHaveBeenCalled();
      expect(mockHandler2).not.toHaveBeenCalled();
      expect(mockHandler3).toHaveBeenCalledTimes(1);
    });

    it("should remove all listeners when no event is specified", () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();

      emitter.on("messageReceived", mockHandler1);
      emitter.on("statusUpdate", mockHandler2);

      emitter.removeAllListeners();

      emitter.emit("messageReceived", "test");
      emitter.emit("statusUpdate", true);

      expect(mockHandler1).not.toHaveBeenCalled();
      expect(mockHandler2).not.toHaveBeenCalled();
    });
  });

  describe("listenerCount", () => {
    it("should return the correct number of listeners", () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();

      expect(emitter.listenerCount("messageReceived")).toBe(0);

      emitter.on("messageReceived", mockHandler1);
      expect(emitter.listenerCount("messageReceived")).toBe(1);

      emitter.on("messageReceived", mockHandler2);
      expect(emitter.listenerCount("messageReceived")).toBe(2);

      emitter.off("messageReceived", mockHandler1);
      expect(emitter.listenerCount("messageReceived")).toBe(1);
    });
  });

  describe("eventNames", () => {
    it("should return all registered event names", () => {
      const mockHandler = jest.fn();

      emitter.on("userJoined", mockHandler);
      emitter.on("messageReceived", mockHandler);
      emitter.on("statusUpdate", mockHandler);

      const eventNames = emitter.eventNames();
      expect(eventNames).toHaveLength(3);
      expect(eventNames).toContain("userJoined");
      expect(eventNames).toContain("messageReceived");
      expect(eventNames).toContain("statusUpdate");
    });

    it("should return empty array when no events are registered", () => {
      const eventNames = emitter.eventNames();
      expect(eventNames).toHaveLength(0);
    });
  });

  // Type safety tests (these will fail at compile time if types are wrong)
  it("should enforce type safety", () => {
    // These should compile without errors
    emitter.on("userJoined", (userId: string, timestamp: number) => {});
    emitter.on("messageReceived", (message: string) => {});
    emitter.on("statusUpdate", (online: boolean) => {});

    // @ts-expect-error - Wrong parameter type
    emitter.emit("userJoined", 123, Date.now());

    // @ts-expect-error - Missing parameter
    emitter.emit("userJoined", "user123");

    // @ts-expect-error - Wrong event name
    emitter.emit("nonexistentEvent", "test");
  });
});
