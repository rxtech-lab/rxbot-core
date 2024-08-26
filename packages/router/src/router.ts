import fs from "fs";
import {
  AdapterInterface,
  DEFAULT_ROOT_ROUTE,
  ErrorPageProps,
  ImportedRoute,
  MatchedRoute,
  Menu,
  RenderedComponent,
  RenderedComponentProps,
  RouteInfo,
  RouteInfoFile,
  SpecialRouteType,
  StorageInterface,
} from "@rx-lab/common";
import { matchRoute, parseQuery } from "./router.utils";

/**
 * Import the route component from the file path.
 * Will also import the metadata if available.
 * @param info
 */
export async function importRoute(info: RouteInfo): Promise<ImportedRoute> {
  const component = info.page ? await import(info.page) : undefined;
  return {
    page: info.page,
    route: info.route,
    subRoutes: await Promise.all(
      (info.subRoutes ?? []).map((subRoute) => importRoute(subRoute)),
    ),
    metadata: info.metadata,
    component: component?.default,
    error: info.error,
    "404": info["404"],
  };
}

async function getSpecialRoute(info: RouteInfo, type: SpecialRouteType) {
  let component: any | null = null;
  if (type === "error") {
    component = await import(info.error);
  } else {
    component = await import(info["404"]);
  }
  return component;
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

/**
 * Match a special route with the path.
 * 1. If Matched, return the route.
 * 2. If no match, find the nearest route.
 *  - if the path is `/blog/post` and the route is `/blog/[slug]`,
 *  the route `/blog/[slug]` will be returned.
 *  - If the path is `/blog/post` and the route is `/blog`,
 *  the route `/blog/` will be returned. Since the route `/blog` is the nearest route.
 *  - If the path is `/blog/post` and the route is `/about`,
 *    the route `/` will be returned. Since the route `/` is the nearest route.
 *
 * @param routes
 * @param path
 */
export async function matchSpecialRouteWithPath(
  routes: RouteInfo[],
  path: string,
): Promise<RouteInfo> {
  // Helper function to check if a route matches the path
  const isMatch = (route: string, inputPath: string): boolean => {
    const routeParts = route.split("/").filter(Boolean);
    const inputParts = inputPath.split("/").filter(Boolean);

    if (routeParts.length > inputParts.length) return false;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i] !== inputParts[i] && !routeParts[i].startsWith("[")) {
        return false;
      }
    }

    return true;
  };

  // Helper function to calculate the score of a match
  const calculateScore = (route: string, inputPath: string): number => {
    const routeParts = route.split("/").filter(Boolean);
    const inputParts = inputPath.split("/").filter(Boolean);
    let score = 0;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i] === inputParts[i]) {
        score += 2; // Exact match
      } else if (routeParts[i].startsWith("[")) {
        score += 1; // Dynamic segment match
      } else {
        break;
      }
    }

    // Penalize for extra segments in the input path
    score -= Math.max(0, inputParts.length - routeParts.length);

    return score;
  };

  // Recursive function to search for the best matching route
  const findBestMatch = (
    currentRoutes: RouteInfo[],
    inputPath: string,
    bestMatch: { route: RouteInfo; score: number } | null = null,
  ): { route: RouteInfo; score: number } | null => {
    let foundBestMatch = bestMatch;
    for (const route of currentRoutes) {
      if (isMatch(route.route, inputPath)) {
        const score = calculateScore(route.route, inputPath);
        if (
          !bestMatch ||
          score > bestMatch.score ||
          (score === bestMatch.score &&
            route.route.length > bestMatch.route.route.length)
        ) {
          foundBestMatch = { route, score };
        }
      }

      if (route.subRoutes) {
        const subMatch = findBestMatch(route.subRoutes, inputPath, bestMatch);
        if (
          subMatch &&
          (!bestMatch ||
            subMatch.score > bestMatch.score ||
            (subMatch.score === bestMatch.score &&
              subMatch.route.route.length > bestMatch.route.route.length))
        ) {
          foundBestMatch = subMatch;
        }
      }
    }

    return foundBestMatch;
  };

  const bestMatch = findBestMatch(routes, path);

  if (bestMatch && bestMatch.score > 0) {
    return bestMatch.route;
  }

  // If no match found, return the root route
  return routes.find((route) => route.route === DEFAULT_ROOT_ROUTE)!;
}

interface RouterOptions {
  adapter: AdapterInterface<any, any, any>;
  storage: StorageInterface;
}

export class Router {
  private _routeInfoFile: RouteInfoFile | null = null;
  private adapter: AdapterInterface<any, any, any>;
  private storage: StorageInterface;

  constructor({ adapter, storage }: RouterOptions) {
    this.adapter = adapter;
    this.storage = storage;
  }

  async init(fromFile: string) {
    // read the file and parse the routes
    this._routeInfoFile = JSON.parse(
      fs.readFileSync(fromFile, "utf-8"),
    ) as RouteInfoFile;
    await this.updateMenu();
  }

  /**
   * Get the route info file.
   */
  get routeInfoFile() {
    return this._routeInfoFile;
  }

  async initFromRoutes(routeFile: RouteInfoFile) {
    this._routeInfoFile = routeFile;
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
   * console.log(route); // "/home"
   */
  async getRouteFromKey(key: string) {
    return this.storage.restoreHistory(key);
  }

  /**
   * Render a special route with the type.
   * @param path Current route
   * @param type The type of the special route.
   * @param query Query string parameters passed to the route.
   * @param props The Properties passed to the component
   */
  async renderSpecialRoute(
    path: string | undefined,
    type: SpecialRouteType,
    query: Record<string, string>,
    props: RenderedComponentProps,
  ): Promise<RenderedComponent> {
    const matchedRoute = await matchSpecialRouteWithPath(
      this.routeInfoFile.routes,
      path ?? DEFAULT_ROOT_ROUTE,
    );
    const component = await getSpecialRoute(matchedRoute, type);
    return {
      currentRoute: path,
      path: matchedRoute.route,
      matchedRoute: {
        ...matchedRoute,
        params: {},
        query: {},
        component: component.default,
      },
      component: component.default,
      queryString: {},
      props: props,
      params: {},
      isError: type === "error" || type === "404",
    };
  }

  async render(key: string, defaultRoute?: string): Promise<RenderedComponent> {
    const currentRoute = defaultRoute
      ? defaultRoute
      : (await this.storage.restoreRoute(key)) ?? DEFAULT_ROOT_ROUTE;
    const parsedRoute = await this.adapter.decodeRoute(currentRoute);
    // if the route is invalid, render the error page
    if (!parsedRoute) {
      const errorQuery: ErrorPageProps = {
        error: new Error(`Invalid route: ${currentRoute}`),
        //TODO: Use error package in the future
        code: 500,
      };
      return await this.renderSpecialRoute(
        currentRoute,
        "error",
        {},
        errorQuery,
      );
    }
    const matchedRoute = await matchRouteWithPath(
      this.routeInfoFile.routes,
      parsedRoute,
    );
    const queryString = parseQuery(parsedRoute);
    if (!matchedRoute) {
      const errorQuery: ErrorPageProps = {
        error: new Error(`Route not found: ${parsedRoute}`),
        code: 404,
      };
      return await this.renderSpecialRoute(parsedRoute, "404", {}, errorQuery);
    }
    return {
      matchedRoute,
      component: matchedRoute.component,
      queryString,
      params: matchedRoute.params,
      path: matchedRoute.route,
      currentRoute: currentRoute,
      props: {},
    };
  }
}
