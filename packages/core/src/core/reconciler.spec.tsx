import type { AdapterInterface, Container } from "@rx-lab/common";
import React from "react";
import { Renderer } from "./reconciler";
import "packages/router/src/global.d.tsx";
import * as process from "node:process";
import { MemoryStorage } from "@rx-lab/storage/memory";

// Mock adapter
class MockAdapter implements AdapterInterface<Container<any, any>, any> {
  messages: string[] = [];

  async init(): Promise<void> {}

  async componentOnMount(): Promise<void> {}

  async adapt(container: Container<any, any>, isUpdate: boolean): Promise<any> {
    if (container.children.length > 0) {
      this.messages.push("Container has children");
    }
    return container.children;
  }
}

process.env.NODE_ENV = "development";
describe("Reconciler(Suspendable)", () => {
  let mockAdapter: MockAdapter;
  let renderer: Renderer<Container<any, any>>;

  // Mock component that can suspend
  function SuspendableComponent() {
    return <div>Loaded Content</div>;
  }

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    renderer = new Renderer({
      adapter: mockAdapter,
      storage: new MemoryStorage(),
    });
  });

  it("should not send any message when app is suspended", async () => {
    const App = () => (
      <suspendable shouldSuspend={true}>
        <SuspendableComponent />
      </suspendable>
    );

    await renderer.init(<App />);
    await renderer.render({
      chatroomInfo: undefined,
      message: undefined,
      type: "ROOT",
      children: [],
    });

    expect(mockAdapter.messages).toHaveLength(0);
  });

  it("should send message when app is not suspended", async () => {
    const App = () => (
      <suspendable shouldSuspend={false}>
        <SuspendableComponent />
      </suspendable>
    );

    await renderer.init(<App />);
    await renderer.render({
      type: "ROOT",
      children: [],
      chatroomInfo: undefined,
      message: undefined,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(mockAdapter.messages).toHaveLength(1);
  });
});
