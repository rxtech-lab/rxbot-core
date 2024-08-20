import fs from "fs";
import {
  AdapterInterface,
  DEFAULT_ROOT_ROUTE,
  ImportedRoute,
  MatchedRoute,
  Menu,
  RenderedComponent,
  RouteInfo,
  RouteInfoFile,
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
  const [pathname] = path.split("?");
  const query = parseQuery(path);

  for (const route of routes) {
    const match = matchRoute(route.route, pathname);
    const importedRoute = await importRoute(route);
    if (match) {
      return {
        ...importedRoute,
        params: match,
        query: query as any,
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
  private routeInfoFile: RouteInfoFile | null = null;
  private adapter: AdapterInterface<any, any, any>;
  private storage: StorageInterface;

  constructor({ adapter, storage }: RouterOptions) {
    this.adapter = adapter;
    this.storage = storage;
  }

  async init(fromFile: string) {
    // read the file and parse the routes
    this.routeInfoFile = JSON.parse(
      fs.readFileSync(fromFile, "utf-8"),
    ) as RouteInfoFile;
    await this.updateMenu();
  }

  async initFromRoutes(routeFile: RouteInfoFile) {
    this.routeInfoFile = routeFile;
    await this.updateMenu();
  }

  private generateMenu(routes: RouteInfo[]): Menu[] {
    return routes
      .filter((r) => r.metadata)
      .filter((r) => r.metadata.includeInMenu ?? true)
      .map((route) => {
        return {
          href: route.route,
          name: route.metadata.title ?? "",
          description: route.metadata.description,
          children: this.generateMenu(route.subRoutes ?? []),
        };
      });
  }

  private async updateMenu() {
    const menu = this.generateMenu(this.routeInfoFile.routes);
    await this.adapter.setMenus(menu);
  }

  async navigateTo(key: string, path: string) {
    await this.storage.saveRoute(key, path);
  }

  /**
   * Get the route from the React key.
   * @param key The key of the component.
   * @returns The route of the component.
   *
   * @example
   * // Support you have a component with the key `home` at the route `/home`
   * // <Component key="home" />
   *
   * const route = await router.getRouteFromKey("home");
   * console.log(route.route); // "/home"
   */
  async getRouteFromKey(key: string) {
    return this.routeInfoFile.componentKeyMap[key];
  }

  async render(key: string): Promise<RenderedComponent> {
    const currentRoute =
      (await this.storage.restoreRoute(key)) ?? DEFAULT_ROOT_ROUTE;
    const parsedRoute = this.adapter.parseRoute(currentRoute);
    const matchedRoute = await matchRouteWithPath(
      this.routeInfoFile.routes,
      parsedRoute,
    );
    const queryString = parseQuery(parsedRoute);
    if (!matchedRoute) {
      throw new Error(`Route not found: ${parsedRoute}`);
    }
    return {
      matchedRoute,
      component: matchedRoute.component,
      queryString,
      params: matchedRoute.params,
      path: matchedRoute.route,
    };
  }
}
