import { REACT_CLIENT_COMPONENT_TYPE } from "@rx-lab/common";
import { isReactElement, renderServerComponent } from "./renderServerComponent";

describe("renderServerComponents", () => {
  const sleepPromise = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // simple top level components
  describe("top level components (without props)", () => {
    it("should be able to render server components", async () => {
      async function Page() {
        await sleepPromise(100);
        return <div>This is a page</div>;
      }

      const result = await renderServerComponent(Page, {});
      expect(isReactElement(result)).toBe(true);
    });

    it("should be able to render client component", async () => {
      function Page() {
        return <div>This is a page</div>;
      }

      Page.$$typeof = Symbol.for(REACT_CLIENT_COMPONENT_TYPE);

      const result = await renderServerComponent(Page, {});
      expect(isReactElement(result)).toBe(true);
    });
  });

  describe("top level components (with props)", () => {
    it("should be able to render server components", async () => {
      async function Page({ hello }: { hello: string }) {
        await sleepPromise(100);
        return <div>This is a {hello}</div>;
      }

      const result = await renderServerComponent(Page, { hello: "world" });
      expect(isReactElement(result)).toBe(true);
      expect(result.props.children.join("")).toBe("This is a world");
    });

    it("should be able to render client component", async () => {
      function Page({ hello }: { hello: string }) {
        return <div>This is a {hello}</div>;
      }

      Page.$$typeof = Symbol.for(REACT_CLIENT_COMPONENT_TYPE);

      const result = await renderServerComponent(Page, { hello: "world" });
      expect(isReactElement(result)).toBe(true);
    });
  });
});
