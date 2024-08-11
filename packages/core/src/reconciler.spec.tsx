import React from "react";
import { Renderer } from "./reconciler";
import { AdapterInterface, Container } from "@rx-lab/common";
import "@rx-lab/router/src/global.d.ts";

// Mock adapter
class MockAdapter implements AdapterInterface<Container, any> {
  messages: string[] = [];

  async init(): Promise<void> {}

  async componentOnMount(): Promise<void> {}

  async adapt(container: Container, isUpdate: boolean): Promise<any> {
    if (container.children.length > 0) {
      this.messages.push("Container has children");
    }
    return container.children;
  }
}

describe("Reconciler(Suspendable)", () => {
  let mockAdapter: MockAdapter;
  let renderer: Renderer<Container>;

  // Mock component that can suspend
  function SuspendableComponent() {
    return <div>Loaded Content</div>;
  }

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    renderer = new Renderer({
      adapter: mockAdapter,
    });
  });

  it("should not send any message when app is suspended", async () => {
    const App = () => (
      <suspendable shouldSuspend={true}>
        <SuspendableComponent />
      </suspendable>
    );

    await renderer.render(<App />, {
      type: "ROOT",
      children: [],
    } as Container);

    expect(mockAdapter.messages).toHaveLength(0);
  });

  it("should send message when app is suspended", async () => {
    const App = () => (
      <suspendable shouldSuspend={false}>
        <SuspendableComponent />
      </suspendable>
    );

    await renderer.render(<App />, {
      type: "ROOT",
      children: [],
    } as Container);

    expect(mockAdapter.messages).toHaveLength(1);
  });
});
