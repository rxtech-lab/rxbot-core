import fs from "fs";
import type {
  AdapterInterface,
  MatchedRoute,
  Menu,
  Route,
  RouteInfo,
  RouteMetadata,
  StorageInterface,
} from "@rx-lab/common";
import { matchRoute, parseQuery } from "./router.utils";

/**
 * Import the route component from the file path.
 * Will also import the metadata if available.
 * @param info
 */
export async function importRoute(info: RouteInfo): Promise<Route> {
  const component = await import(info.filePath);
  const metadata: RouteMetadata = component.metadata ?? {};
  return {
    filePath: info.filePath,
    route: info.route,
    subRoutes: await Promise.all(
      (info.subRoutes ?? []).map((subRoute) => importRoute(subRoute)),
    ),
    component: component.default,
    metadata: metadata,
    isAsync: info.isAsync,
  };
}

/**
 * Match the route with the path also provides the params and query.
 * @param routes List of available routes.
 * @param path The path to match.
 */
export async function matchRouteWithPath(
  routes: Route[],
  path: string,
): Promise<MatchedRoute | null> {
  const [pathname, search] = path.split("?");
  const query = parseQuery(search);

  for (const route of routes) {
    const match = matchRoute(route.route, pathname);
    if (match) {
      return {
        ...route,
        params: match,
        query,
      };
    }

    if (route.subRoutes) {
      const subRouteMatch = await matchRouteWithPath(route.subRoutes, path);
      if (subRouteMatch) {
        return subRouteMatch;
      }
    }
  }

  return null;
}

interface RouterOptions {
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
}

export class Router {
  routes: Route[] = [];
  adapter: AdapterInterface<any, any, any>;

  constructor({ adapter }: RouterOptions) {
    this.adapter = adapter;
  }

  async init(fromFile: string) {
    // read the file and parse the routes
    const routes = JSON.parse(
      fs.readFileSync(fromFile, "utf-8"),
    ) as RouteInfo[];

    // import the routes
    this.routes = await Promise.all(routes.map((route) => importRoute(route)));
    await this.updateMenu();
  }

  async initFromRoutes(routes: RouteInfo[]) {
    this.routes = await Promise.all(routes.map((route) => importRoute(route)));
    console.log("Routes: ", this.routes);
    await this.updateMenu();
  }

  private generateMenu(routes: Route[]): Menu[] {
    return routes.map((route) => {
      return {
        href: route.route,
        name: route.metadata.title ?? "",
        description: route.metadata.description,
        children: this.generateMenu(route.subRoutes ?? []),
      };
    });
  }

  private async updateMenu() {
    const menu = this.generateMenu(this.routes);
    await this.adapter.setMenus(menu);
  }

  async render(path: string) {
    const matchedRoute = await matchRouteWithPath(this.routes, path);
    if (!matchedRoute) {
      throw new Error("Route not found");
    }
    return { matchedRoute, component: matchedRoute.component };
  }
}
