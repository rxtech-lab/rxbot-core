import { Component, type InstanceProps, InstanceType } from "@rx-lab/common";
import { MemoryStorage } from "./memory";

class MockComponent extends Component {
  id = "mock";
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
    memoryStorage = new MemoryStorage();
    mockComponent = new MockComponent();
    mockState = { key: "value" };
  });

  test("should store state in memory", async () => {
    await memoryStorage.saveState("testKey", mockState);
    expect(await memoryStorage.restoreState("testKey")).toEqual(mockState);
  });
});
