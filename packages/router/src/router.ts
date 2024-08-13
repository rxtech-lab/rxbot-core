import fs from "fs";
import type {
  AdapterInterface,
  ImportedRoute,
  MatchedRoute,
  Menu,
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
export async function importRoute(info: RouteInfo): Promise<ImportedRoute> {
  const component = await import(info.filePath);
  const metadata: RouteMetadata = component.metadata ?? {};
  return {
    filePath: info.filePath,
    route: info.route,
    subRoutes: await Promise.all(
      (info.subRoutes ?? []).map((subRoute) => importRoute(subRoute)),
    ),
    metadata: metadata,
    component: component.default,
    isAsync: info.isAsync,
  };
}

/**
 * Match the route with the path also provides the params and query.
 * @param routes List of available routes.
 * @param path The path to match.
 */
export async function matchRouteWithPath(
  routes: RouteInfo[],
  path: string,
): Promise<MatchedRoute | null> {
  const [pathname, search] = path.split("?");
  const query = parseQuery(search);

  for (const route of routes) {
    const match = matchRoute(route.route, pathname);
    const importedRoute = await importRoute(route);
    if (match) {
      return {
        ...importedRoute,
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
  routes: RouteInfo[] = [];
  adapter: AdapterInterface<any, any, any>;

  constructor({ adapter }: RouterOptions) {
    this.adapter = adapter;
  }

  async init(fromFile: string) {
    // read the file and parse the routes
    this.routes = JSON.parse(fs.readFileSync(fromFile, "utf-8")) as RouteInfo[];
    await this.updateMenu();
  }

  async initFromRoutes(routes: RouteInfo[]) {
    this.routes = routes;
    await this.updateMenu();
  }

  private generateMenu(routes: RouteInfo[]): Menu[] {
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
