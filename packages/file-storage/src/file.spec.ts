import * as fs from "node:fs";
import { Route } from "@rx-lab/common";
import { ROUTE_KEY, STATE_KEY } from "@rx-lab/storage";
import { FileStorage } from "./file";

jest.mock("node:fs");

describe("FileStorage", () => {
  let fileStorage: FileStorage;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    fileStorage = new FileStorage();
    jest.clearAllMocks();
  });

  describe("checkIfFileExists", () => {
    it("should return true if file exists", async () => {
      //@ts-expect-error
      mockFs.access.mockImplementation((path, mode, callback) =>
        callback(null),
      );
      const result = await (fileStorage as any).checkIfFileExists("test.json");
      expect(result).toBe(true);
    });

    it("should return false if file does not exist", async () => {
      //@ts-expect-error
      mockFs.access.mockImplementation((path, mode, callback) =>
        callback(new Error()),
      );
      const result = await (fileStorage as any).checkIfFileExists("test.json");
      expect(result).toBe(false);
    });
  });

  describe("createFile", () => {
    it("should create a file with initial content", async () => {
      mockFs.writeFile.mockImplementation((path, data, callback) =>
        callback(null),
      );
      await (fileStorage as any).createFile("test.json", "{}");
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        "test.json",
        "{}",
        expect.any(Function),
      );
    });

    it("should reject if there is an error", async () => {
      mockFs.writeFile.mockImplementation((path, data, callback) =>
        callback(new Error("Write error")),
      );
      await expect(
        (fileStorage as any).createFile("test.json", "{}"),
      ).rejects.toThrow("Write error");
    });
  });

  describe("createFileIfNotExists", () => {
    it("should create a file if it does not exist", async () => {
      jest
        .spyOn(fileStorage as any, "checkIfFileExists")
        .mockResolvedValue(false);
      jest.spyOn(fileStorage as any, "createFile").mockResolvedValue(undefined);
      await (fileStorage as any).createFileIfNotExists("test.json", {});
      expect((fileStorage as any).createFile).toHaveBeenCalledWith(
        "test.json",
        "{}",
      );
    });

    it("should not create a file if it already exists", async () => {
      jest
        .spyOn(fileStorage as any, "checkIfFileExists")
        .mockResolvedValue(true);
      jest.spyOn(fileStorage as any, "createFile").mockResolvedValue(undefined);
      await (fileStorage as any).createFileIfNotExists("test.json", {});
      expect((fileStorage as any).createFile).not.toHaveBeenCalled();
    });
  });

  describe("readState", () => {
    it("should read state from file", async () => {
      jest
        .spyOn(fileStorage as any, "createFileIfNotExists")
        .mockResolvedValue(undefined);
      mockFs.readFile.mockImplementation((path, callback) =>
        callback(null, Buffer.from('{"key":"value"}')),
      );
      const result = await (fileStorage as any).readState();
      expect(result).toEqual({ key: "value" });
    });

    it("should reject if there is an error reading the file", async () => {
      jest
        .spyOn(fileStorage as any, "createFileIfNotExists")
        .mockResolvedValue(undefined);
      mockFs.readFile.mockImplementation((path, callback) =>
        //@ts-expect-error
        callback(new Error("Read error"), null),
      );
      await expect((fileStorage as any).readState()).rejects.toThrow(
        "Read error",
      );
    });
  });

  describe("writeState", () => {
    it("should write state to file", async () => {
      mockFs.writeFile.mockImplementation((path, data, callback) =>
        callback(null),
      );
      await (fileStorage as any).writeState({ key: "value" });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        "state.json",
        '{"key":"value"}',
        expect.any(Function),
      );
    });

    it("should reject if there is an error writing to the file", async () => {
      mockFs.writeFile.mockImplementation((path, data, callback) =>
        callback(new Error("Write error")),
      );
      await expect(
        (fileStorage as any).writeState({ key: "value" }),
      ).rejects.toThrow("Write error");
    });
  });

  describe("restoreState", () => {
    it("should restore state for a given key", async () => {
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({
        [`${STATE_KEY}-testKey`]: { data: { foo: "bar" } },
      });
      const result = await fileStorage.restoreState("testKey");
      expect(result).toEqual({ foo: "bar" });
    });

    it("should return undefined if state does not exist for the key", async () => {
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({});
      const result = await fileStorage.restoreState("testKey");
      expect(result).toBeUndefined();
    });
  });

  describe("saveState", () => {
    it("should save state for a given key", async () => {
      const mockWriteState = jest
        .spyOn(fileStorage as any, "writeState")
        .mockResolvedValue(undefined);
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({});
      await fileStorage.saveState("testKey", "testRoute" as Route, {
        foo: "bar",
      });
      expect(mockWriteState).toHaveBeenCalledWith({
        [`${STATE_KEY}-testKey`]: {
          data: { foo: "bar" },
        },
      });
    });

    it("should call state change listener if exists", async () => {
      jest.spyOn(fileStorage as any, "writeState").mockResolvedValue(undefined);
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({});
      const mockListener = jest.fn();
      fileStorage.subscribeStateChange("testKey", "testRoute", mockListener);
      await fileStorage.saveState("testKey", "testRoute" as Route, {
        foo: "bar",
      });
      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe("restoreRoute", () => {
    it("should restore route for a given key", async () => {
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({
        [`${ROUTE_KEY}-testKey`]: { data: "/test/route" },
      });
      const result = await fileStorage.restoreRoute("testKey");
      expect(result).toBe("/test/route");
    });

    it("should return undefined if route does not exist for the key", async () => {
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({});
      const result = await fileStorage.restoreRoute("testKey");
      expect(result).toBeUndefined();
    });
  });

  describe("saveRoute", () => {
    it("should save route for a given key", async () => {
      const mockWriteState = jest
        .spyOn(fileStorage as any, "writeState")
        .mockResolvedValue(undefined);
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({});
      await fileStorage.saveRoute("testKey", "/test/route");
      expect(mockWriteState).toHaveBeenCalledWith({
        [`${ROUTE_KEY}-testKey`]: { data: "/test/route" },
      });
    });

    it("should call route change listener if exists", async () => {
      jest.spyOn(fileStorage as any, "writeState").mockResolvedValue(undefined);
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({});
      const mockListener = jest.fn();
      fileStorage.subscribeRouteChange("testKey", mockListener);
      await fileStorage.saveRoute("testKey", "/test/route");
      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe("deleteState", () => {
    it("should delete state for a given key", async () => {
      const mockWriteState = jest
        .spyOn(fileStorage as any, "writeState")
        .mockResolvedValue(undefined);
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({
        [`${STATE_KEY}-testKey`]: { route: "testRoute", state: { foo: "bar" } },
      });
      await fileStorage.deleteState("testKey", "testRoute" as Route);
      expect(mockWriteState).toHaveBeenCalledWith({});
    });

    it("should call state change listener if exists", async () => {
      jest.spyOn(fileStorage as any, "writeState").mockResolvedValue(undefined);
      jest.spyOn(fileStorage as any, "readState").mockResolvedValue({});
      const mockListener = jest.fn();
      fileStorage.subscribeStateChange("testKey", "testRoute", mockListener);
      await fileStorage.deleteState("testKey", "testRoute" as Route);
      expect(mockListener).toHaveBeenCalled();
    });
  });
});
