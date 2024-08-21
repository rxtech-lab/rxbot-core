import { RouteInfo } from "@rx-lab/common";
import { importRoute, matchRouteWithPath, Router } from "./router";

const clientComponents = ["../tests/client/test-component1.tsx"];

const serverComponents = ["../tests/server/test-component1.tsx"];

describe("ImportRoute", () => {
  for (const component of [...clientComponents, ...serverComponents]) {
    it(`should import component ${component}`, async () => {
      const route = await importRoute({
        route: "/",
        filePath: component,
        metadata: {},
      });
      expect(route).toBeTruthy();
      expect(route.route).toBe("/");
      expect(route.filePath).toBe(component);
      expect(route.component).toBeTruthy();
    });
  }
});

describe("matchRouteWithPath", () => {
  const routes: RouteInfo[] = [
    {
      route: "/user/[id]",
      filePath: clientComponents[0],
      metadata: {},
    },
    {
      route: "/blog/[slug]",
      filePath: clientComponents[0],
      metadata: {},
      subRoutes: [
        {
          route: "/blog/[slug]/comments",
          filePath: clientComponents[0],
          metadata: {},
        },
      ],
    },
    {
      route: "/about",
      filePath: clientComponents[0],
      metadata: {},
    },
  ];

  it("should match a simple route", async () => {
    const result = await matchRouteWithPath(routes, "/about");
    expect(result).toBeTruthy();
    expect(result?.route).toBe("/about");
    expect(result?.params).toEqual({});
    expect(result?.query).toEqual({});
  });

  it("should match a route with params", async () => {
    const result = await matchRouteWithPath(routes, "/user/123");
    expect(result).toBeTruthy();
    expect(result?.route).toBe("/user/[id]");
    expect(result?.params).toEqual({ id: "123" });
    expect(result?.query).toEqual({});
  });

  it("should match a subroute", async () => {
    const result = await matchRouteWithPath(routes, "/blog/my-post/comments");
    expect(result).toBeTruthy();
    expect(result?.route).toBe("/blog/[slug]/comments");
    expect(result?.params).toEqual({ slug: "my-post" });
    expect(result?.query).toEqual({});
  });

  it("should handle query parameters", async () => {
    const result = await matchRouteWithPath(
      routes,
      "/user/123?page=1&sort=desc",
    );
    expect(result).toBeTruthy();
    expect(result?.route).toBe("/user/[id]");
    expect(result?.params).toEqual({ id: "123" });
    expect(result?.query).toEqual({ page: "1", sort: "desc" });
  });

  it("should return null for unmatched routes", async () => {
    const result = await matchRouteWithPath(routes, "/nonexistent");
    expect(result).toBeNull();
  });
});

describe("should be able to render", () => {
  const mockAdapter = {
    setMenus: jest.fn(),
    decodeRoute: jest.fn().mockReturnValue("/client"),
  };

  const mockStorage = {
    restoreRoute: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be able to render", async () => {
    const router = new Router({
      adapter: mockAdapter as any,
      storage: mockStorage as any,
    });
    await router.initFromRoutes({
      routes: [
        {
          route: "/client",
          filePath: clientComponents[0],
          metadata: {},
        },
        {
          route: "/server",
          filePath: serverComponents[0],
          metadata: {},
        },
      ],
    });

    const clientResult = await router.render("/client");
    expect(clientResult).toBeTruthy();
    expect(typeof clientResult.component).toBe("function");

    const serverResult = await router.render("/server");
    expect(serverResult).toBeTruthy();
    expect(typeof serverResult.component).toBe("function");
  });
});
