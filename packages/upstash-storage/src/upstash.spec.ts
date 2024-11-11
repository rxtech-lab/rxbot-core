import { Route } from "@rx-lab/common";
import { HISTORY_KEY, ROUTE_KEY, STATE_KEY } from "@rx-lab/storage";
import { Redis } from "@upstash/redis";
import { UpstashStorage } from "./upstash";

jest.mock("@upstash/redis");

describe("UpstashStorage", () => {
  let upstashStorage: UpstashStorage;
  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn().mockResolvedValue(1),
  };

  beforeEach(() => {
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(
      () => mockRedis as any,
    );
    upstashStorage = new UpstashStorage({
      url: "mock-url",
      token: "mock-token",
    });
    jest.clearAllMocks();
  });

  describe("addHistory", () => {
    it("should add history for a given key", async () => {
      const key = "testKey";
      const route: Route = "/test/path";
      await upstashStorage.addHistory(key, {
        route,
      });
      expect(mockRedis.set).toHaveBeenCalledWith(`${HISTORY_KEY}-${key}`, {
        route,
      });
    });
  });

  describe("deleteHistory", () => {
    it("should delete history for a given key", async () => {
      const key = "testKey";
      await upstashStorage.deleteHistory(key);
      expect(mockRedis.del).toHaveBeenCalledWith(`${HISTORY_KEY}-${key}`);
    });
  });

  describe("deleteState", () => {
    it("should delete state for a given key", async () => {
      const key = "testKey";
      const route: Route = "/test/path";
      const mockListener = jest.fn();
      upstashStorage.subscribeStateChange(key, route, mockListener);

      await upstashStorage.deleteState(key, { route });

      expect(mockRedis.del).toHaveBeenCalledWith(`${STATE_KEY}-${key}`);
      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe("restoreHistory", () => {
    it("should restore history for a given key", async () => {
      const key = "testKey";
      const mockRoute: Route = "test/path";
      mockRedis.get.mockResolvedValue(mockRoute);
      mockRedis.exists.mockResolvedValue(1);

      const result = await upstashStorage.restoreHistory(key);

      expect(mockRedis.get).toHaveBeenCalledWith(`${HISTORY_KEY}-${key}`);
      expect(result).toEqual(mockRoute);
    });

    it("should return undefined if history does not exist for the key", async () => {
      const key = "testKey";
      mockRedis.get.mockResolvedValue(null);

      const result = await upstashStorage.restoreHistory(key);

      expect(result).toBeUndefined();
    });
  });

  describe("restoreRoute", () => {
    it("should restore route for a given key", async () => {
      const key = "testKey";
      const mockRoute: Route = "/test/path";
      mockRedis.get.mockResolvedValue(mockRoute);

      const result = await upstashStorage.restoreRoute(key);

      expect(mockRedis.get).toHaveBeenCalledWith(`${ROUTE_KEY}-${key}`);
      expect(result).toEqual(mockRoute);
    });

    it("should return undefined if route does not exist for the key", async () => {
      const key = "testKey";
      mockRedis.get.mockResolvedValue(null);

      const result = await upstashStorage.restoreRoute(key);

      expect(result).toBeUndefined();
    });
  });

  describe("restoreState", () => {
    it("should restore state for a given key", async () => {
      const key = "testKey";
      const mockState = { foo: "bar" };
      mockRedis.get.mockResolvedValue(mockState);

      const result = await upstashStorage.restoreState(key, {
        route: "/test/path",
      });
      expect(mockRedis.get).toHaveBeenCalledWith(`${STATE_KEY}-${key}`);
      expect(result).toEqual(mockState);
    });

    it("should restore state if state is 0", async () => {
      const key = "testKey";
      const mockState = 0;
      mockRedis.get.mockResolvedValue(mockState);

      const result = await upstashStorage.restoreState(key, {
        route: "/test/path",
      });
      expect(mockRedis.get).toHaveBeenCalledWith(`${STATE_KEY}-${key}`);
      expect(result).toEqual(mockState);
    });

    it("should restore state if state is null", async () => {
      const key = "testKey";
      const mockState = null;
      mockRedis.get.mockResolvedValue(mockState);
      mockRedis.exists.mockResolvedValue(1);

      const result = await upstashStorage.restoreState(key, {
        route: "/test/path",
      });
      expect(mockRedis.get).toHaveBeenCalledWith(`${STATE_KEY}-${key}`);
      expect(result).toEqual(mockState);
    });

    it("should return undefined if state does not exist for the key", async () => {
      const key = "testKey";
      mockRedis.get.mockResolvedValue(null);
      mockRedis.exists.mockResolvedValue(0);

      const result = await upstashStorage.restoreState(key, {
        route: "/test/path",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("saveRoute", () => {
    it("should save route for a given key", async () => {
      const key = "testKey";
      const path = "/test/path";
      const mockListener = jest.fn();
      upstashStorage.subscribeRouteChange(key, mockListener);

      await upstashStorage.saveRoute(key, {
        route: path,
      });

      expect(mockRedis.set).toHaveBeenCalledWith(`${ROUTE_KEY}-${key}`, {
        route: path,
      });
      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe("saveState", () => {
    it("should save state for a given key", async () => {
      const key = "testKey";
      const route: Route = "/test/path";
      const state = { foo: "bar" };
      const mockListener = jest.fn();
      upstashStorage.subscribeStateChange(key, route, mockListener);

      await upstashStorage.saveState(key, route, state);

      expect(mockRedis.set).toHaveBeenCalledWith(`${STATE_KEY}-${key}`, state);
      expect(mockRedis.expire).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalled();
    });

    it("should save state for a given key in persisted mode", async () => {
      const key = "testKey";
      const route: Route = "/test/path";
      const state = { foo: "bar" };
      const mockListener = jest.fn();
      upstashStorage.subscribeStateChange(key, route, mockListener);

      await upstashStorage.saveState(key, route, state, { isPersisted: true });

      expect(mockRedis.set).toHaveBeenCalledWith(`${STATE_KEY}-${key}`, state);
      expect(mockListener).toHaveBeenCalled();
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });
  });
});
