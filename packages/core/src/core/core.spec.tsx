import * as process from "node:process";
import type {
  AdapterInterface,
  Container,
  Menu,
  StoredRoute,
} from "@rx-lab/common";
// @ts-ignore
import { MemoryStorage } from "@rx-lab/storage/memory";
import { Core } from "./core";

// Mock adapter
class MockAdapter implements AdapterInterface<Container<any, any>, any, any> {
  messages: string[] = [];

  async init(): Promise<void> {}

  async componentOnMount(): Promise<void> {}

  async adapt(container: Container<any, any>, isUpdate: boolean): Promise<any> {
    if (container.children.length > 0) {
      this.messages.push("Container has children");
    }
    return container.children;
  }

  getCurrentRoute(message: any): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  setMenus(menus: Menu[]): Promise<void> {
    return Promise.resolve(undefined);
  }

  async decodeRoute(route: string): Promise<StoredRoute> {
    return {
      route: "",
      type: "page",
    };
  }

  getRouteKey(message: Container<any, any>): string {
    return "";
  }

  async onDestroy(): Promise<void> {}

  subscribeToMessageChanged(
    callback: (container: Container<any, any>, message: any) => Promise<void>,
  ) {}

  handleMessageUpdate(message: any): Promise<void> {
    return Promise.resolve(undefined);
  }

  createContainer(message: any) {
    return {} as any;
  }

  handleSendMessage(message: any): Promise<void> {
    return Promise.resolve(undefined);
  }
}

process.env.NODE_ENV = "development";
describe.skip("Reconciler(Suspendable)", () => {
  let mockAdapter: MockAdapter;
  let renderer: Core<Container<any, any>>;

  // Mock component that can suspend
  function SuspendableComponent() {
    return <div>Loaded Content</div>;
  }

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    renderer = new Core({
      adapter: mockAdapter,
      storage: new MemoryStorage(),
      routeFile: {} as any,
    });
  });

  it("should not send any message when app is suspended", async () => {
    const App = () => (
      // @ts-ignore
      <suspendable shouldSuspend={true}>
        <SuspendableComponent />
        {/*// @ts-ignore*/}
      </suspendable>
    );

    await renderer.init();
    await renderer.render({
      chatroomInfo: undefined,
      message: undefined,
      type: "ROOT",
      children: [],
      hasBeenMentioned: false,
      isInGroup: false,
    });

    expect(mockAdapter.messages).toHaveLength(0);
  });

  it("should send message when app is not suspended", async () => {
    const App = () => (
      // @ts-ignore
      <suspendable shouldSuspend={false}>
        <SuspendableComponent />
        {/*// @ts-ignore*/}
      </suspendable>
    );

    await renderer.init();
    await renderer.render({
      type: "ROOT",
      children: [],
      chatroomInfo: undefined,
      message: undefined,
      hasBeenMentioned: false,
      isInGroup: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(mockAdapter.messages).toHaveLength(1);
  });
});
