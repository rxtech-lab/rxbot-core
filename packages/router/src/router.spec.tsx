import { RouteInfo } from "@rx-lab/common";
import {
  Router,
  importRoute,
  matchRouteWithPath,
  matchSpecialRouteWithPath,
} from "./router";

const clientComponents = ["../tests/client/test-component1.tsx"];

const serverComponents = ["../tests/server/test-component1.tsx"];

describe("ImportRoute", () => {
  for (const component of [...clientComponents, ...serverComponents]) {
    it(`should import component ${component}`, async () => {
      const route = await importRoute({
        route: "/",
        page: component,
        error: "",
        "404": "",
        metadata: {},
      });
      expect(route).toBeTruthy();
      expect(route.route).toBe("/");
      expect(route.page).toBe(component);
      expect(route.component).toBeTruthy();
    });
  }
});

describe("matchRouteWithPath", () => {
  const routes: RouteInfo[] = [
    {
      route: "/user/[id]",
      page: clientComponents[0],
      metadata: {},
      error: "",
      "404": "",
    },
    {
      route: "/blog/[slug]",
      page: clientComponents[0],
      metadata: {},
      error: "",
      "404": "",
      subRoutes: [
        {
          route: "/blog/[slug]/comments",
          page: clientComponents[0],
          metadata: {},
          error: "",
          "404": "",
        },
      ],
    },
    {
      route: "/about",
      page: clientComponents[0],
      metadata: {},
      error: "",
      "404": "",
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
          page: clientComponents[0],
          error: "",
          "404": "",
          metadata: {},
        },
        {
          route: "/server",
          page: serverComponents[0],
          metadata: {},
          error: "",
          "404": "",
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

describe("matchSpecialRouteWithPath", () => {
  const mockRoutes: RouteInfo[] = [
    {
      route: "/",
      404: "/404",
      error: "/error",
      page: "/index",
      subRoutes: [
        {
          route: "/blog",
          404: "/blog/404",
          error: "/blog/error",
          page: "/blog/index",
          subRoutes: [
            {
              route: "/blog/[slug]",
              404: "/blog/404",
              error: "/blog/error",
              page: "/blog/[slug]",
            },
          ],
        },
        {
          route: "/about",
          404: "/404",
          error: "/error",
          page: "/about",
        },
      ],
    },
  ];

  it("should match exact routes", async () => {
    const result = await matchSpecialRouteWithPath(mockRoutes, "/about");
    expect(result.route).toBe("/about");
  });

  it("should match dynamic routes", async () => {
    const result = await matchSpecialRouteWithPath(mockRoutes, "/blog/my-post");
    expect(result.route).toBe("/blog/[slug]");
  });

  it("should return the nearest parent route if no exact match is found", async () => {
    const result = await matchSpecialRouteWithPath(
      mockRoutes,
      "/blog/category/post",
    );
    expect(result.route).toBe("/blog/[slug]");
  });

  it("should return the root route if no match is found", async () => {
    const result = await matchSpecialRouteWithPath(
      mockRoutes,
      "/nonexistent/path",
    );
    expect(result.route).toBe("/");
  });

  it("should handle trailing slashes", async () => {
    const result = await matchSpecialRouteWithPath(mockRoutes, "/about/");
    expect(result.route).toBe("/about");
  });

  it("should match the root route", async () => {
    const result = await matchSpecialRouteWithPath(mockRoutes, "/");
    expect(result.route).toBe("/");
  });

  it("should return root route for unmatched paths", async () => {
    const result = await matchSpecialRouteWithPath(
      mockRoutes,
      "/completely/unknown/path",
    );
    expect(result.route).toBe("/");
  });

  it("should prefer longer matches over shorter ones", async () => {
    const extendedRoutes: RouteInfo[] = [
      ...mockRoutes,
      {
        route: "/blog/featured",
        404: "/blog/404",
        error: "/blog/error",
        page: "/blog/featured",
      },
    ];
    const result = await matchSpecialRouteWithPath(
      extendedRoutes,
      "/blog/featured/post",
    );
    expect(result.route).toBe("/blog/featured");
  });

  it("should not over-match dynamic routes", async () => {
    const result = await matchSpecialRouteWithPath(
      mockRoutes,
      "/blog/post/comment",
    );
    expect(result.route).toBe("/blog/[slug]");
  });

  it("should handle empty routes array", async () => {
    const result = await matchSpecialRouteWithPath(
      [
        {
          route: "/",
          404: "/404",
          error: "/error",
          page: "/index",
        },
      ],
      "/any/path",
    );
    expect(result.route).toBe("/");
  });
});
