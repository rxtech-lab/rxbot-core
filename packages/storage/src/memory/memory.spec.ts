import { MemoryStorage } from "./memory";

describe("MemoryStorage", () => {
  let memoryStorage: MemoryStorage;
  let mockState: { key: string };

  beforeEach(() => {
    const mockBuilder = {
      buildFromJson: jest.fn().mockImplementation((component) => component),
    };
    memoryStorage = new MemoryStorage();
    mockState = { key: "value" };
  });

  test("should store state in memory", async () => {
    await memoryStorage.saveState("testKey", "/", mockState);
    expect(await memoryStorage.restoreState("testKey", "/")).toEqual(mockState);
  });

  test("should be able to retrieve the route from the state key", async () => {
    await memoryStorage.saveState("testKey", "/route1", mockState);
    expect(await memoryStorage.restoreRouteFromState("testKey")).toEqual(
      "/route1",
    );
  });
});
