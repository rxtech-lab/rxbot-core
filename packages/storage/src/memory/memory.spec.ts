import { Route } from "@rx-lab/common";
import { MemoryStorage } from "./memory";

describe("MemoryStorage", () => {
  let memoryStorage: MemoryStorage;

  beforeEach(() => {
    memoryStorage = new MemoryStorage();
  });

  describe("restoreState", () => {
    it("should restore state for a given key", async () => {
      await memoryStorage.saveState("testKey", "testRoute" as Route, {
        foo: "bar",
      });
      const result = await memoryStorage.restoreState(
        "testKey",
        "testRoute" as Route,
      );
      expect(result).toEqual({ foo: "bar" });
    });

    it("should return undefined if state does not exist for the key", async () => {
      const result = await memoryStorage.restoreState(
        "nonExistentKey",
        "testRoute" as Route,
      );
      expect(result).toBeUndefined();
    });
  });

  describe("saveState", () => {
    it("should save state for a given key", async () => {
      await memoryStorage.saveState("testKey", "testRoute" as Route, {
        foo: "bar",
      });
      const result = await memoryStorage.restoreState(
        "testKey",
        "testRoute" as Route,
      );
      expect(result).toEqual({ foo: "bar" });
    });

    it("should call state change listener if exists", async () => {
      const mockListener = jest.fn();
      memoryStorage.subscribeStateChange("testKey", "testRoute", mockListener);
      await memoryStorage.saveState("testKey", "testRoute" as Route, {
        foo: "bar",
      });
      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe("deleteState", () => {
    it("should delete state for a given key", async () => {
      await memoryStorage.saveState("testKey", "testRoute" as Route, {
        foo: "bar",
      });
      await memoryStorage.deleteState("testKey", "testRoute" as Route);
      const result = await memoryStorage.restoreState(
        "testKey",
        "testRoute" as Route,
      );
      expect(result).toBeUndefined();
    });

    it("should call state change listener if exists", async () => {
      const mockListener = jest.fn();
      memoryStorage.subscribeStateChange("testKey", "testRoute", mockListener);
      await memoryStorage.saveState("testKey", "testRoute" as Route, {
        foo: "bar",
      });
      await memoryStorage.deleteState("testKey", "testRoute" as Route);
      expect(mockListener).toHaveBeenCalledTimes(2);
    });
  });

  describe("restoreRoute", () => {
    it("should restore route for a given key", async () => {
      await memoryStorage.saveRoute("testKey", "/test/route");
      const result = await memoryStorage.restoreRoute("testKey");
      expect(result).toBe("/test/route");
    });

    it("should return undefined if route does not exist for the key", async () => {
      const result = await memoryStorage.restoreRoute("nonExistentKey");
      expect(result).toBeUndefined();
    });
  });

  describe("saveRoute", () => {
    it("should save route for a given key", async () => {
      await memoryStorage.saveRoute("testKey", "/test/route");
      const result = await memoryStorage.restoreRoute("testKey");
      expect(result).toBe("/test/route");
    });

    it("should call route change listener if exists", async () => {
      const mockListener = jest.fn();
      memoryStorage.subscribeRouteChange("testKey", mockListener);
      await memoryStorage.saveRoute("testKey", "/test/route");
      expect(mockListener).toHaveBeenCalled();
    });
  });
});
