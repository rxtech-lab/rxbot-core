import { MemoryStorage } from "./memory";
import { Component, InstanceProps, InstanceType } from "@rx-lab/common";

class MockComponent extends Component {
  id: string = "mock";
  props: InstanceProps = {};
  type: InstanceType = InstanceType.Container;

  commitUpdate(oldProps: InstanceProps, newProps: InstanceProps): boolean {
    return false;
  }

  finalizeBeforeMount(): void {}
}

describe("MemoryStorage", () => {
  let memoryStorage: MemoryStorage;
  let mockComponent: Component;
  let mockState: { key: string };

  beforeEach(() => {
    const mockBuilder = {
      buildFromJson: jest.fn().mockImplementation((component) => component),
    };
    memoryStorage = new MemoryStorage(mockBuilder as any);
    mockComponent = new MockComponent();
    mockState = { key: "value" };
  });

  test("should store component tree in memory", async () => {
    await memoryStorage.saveComponentTree(mockComponent, "testKey");
    expect(await memoryStorage.restoreComponentTree("testKey")).toBeDefined();
  });

  test("should store state in memory", async () => {
    await memoryStorage.saveState("testKey", mockState);
    expect(await memoryStorage.restoreState("testKey")).toEqual(mockState);
  });
});
