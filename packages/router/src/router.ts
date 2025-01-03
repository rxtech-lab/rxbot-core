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
  StoredRoute,
} from "@rx-lab/common";
import React from "react";
import { matchRoute, parseQuery } from "./router.utils";

/**
 * Import the route component from the file path.
 * Will also import the metadata if available.
 * @param info
 */
export async function importRoute(info: RouteInfo): Promise<ImportedRoute> {
  return {
    page: await info.page?.().then((mod: any) => mod.default),
    route: info.route,
    subRoutes: info.subRoutes,
    metadata: info.metadata,
    api: (await info.api?.()) as any,
    error: await info.error?.().then((mod: any) => mod.default),
    "404": await info["404"]?.().then((mod: any) => mod.default),
  };
}

/**
 * Get the special route component.
 * @param info
 * @param type
 */
async function getSpecialRoute(
  info: ImportedRoute,
  type: SpecialRouteType,
): Promise<() => React.ReactElement | (() => React.ReactElement)[]> {
  if (type === "error") {
    return (info.error() as any).then((mod: any) => mod.default);
  }
  if (type === "404") {
    return (info["404"]() as any).then((mod: any) => mod.default);
  }

  const layouts = info.layouts;
  return (await Promise.all(
    layouts.map(async (layout) => {
      return (await layout()).default;
    }),
  )) as any;
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
export function matchSpecialRouteWithPath(
  routes: RouteInfo[],
  path: string,
): RouteInfo {
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

  /**
   * Get the route info file.
   */
  get routeInfoFile() {
    return this._routeInfoFile;
  }

  /**
   * Initialize the router with the route file.
   * @param routeFile Route file to initialize the router.
   * @param shouldUpdateMenu Should update the menu after initialization.
   */
  async initFromRoutes(routeFile: RouteInfoFile, shouldUpdateMenu = false) {
    this._routeInfoFile = routeFile;
    if (shouldUpdateMenu) {
      await this.updateMenu();
    }
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

  /**
   * Use adapter to update menu reflects the current page structure
   */
  async updateMenu() {
    const menu = this.generateMenu(this.routeInfoFile.routes);
    await this.adapter.setMenus(menu);
  }

  async navigateTo(key: string, path: StoredRoute) {
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
    const matchedRoute = matchSpecialRouteWithPath(
      this.routeInfoFile.routes,
      path ?? DEFAULT_ROOT_ROUTE,
    );
    const component = await getSpecialRoute(matchedRoute as any, type);
    return {
      currentRoute: {
        route: path,
        type: type,
      },
      path: matchedRoute.route,
      matchedRoute: {
        params: {},
        query: {},
        route: matchedRoute.route,
      },
      component: Array.isArray(component) ? undefined : (component as any),
      components: Array.isArray(component) ? (component as any) : undefined,
      queryString: {},
      props: props,
      params: {},
      isError: type === "error" || type === "404",
    };
  }

  async render(
    key: string,
    defaultRoute?: StoredRoute,
  ): Promise<RenderedComponent> {
    const currentRoute: StoredRoute = defaultRoute
      ? defaultRoute
      : ((await this.storage.restoreRoute(key)) ?? {
          route: DEFAULT_ROOT_ROUTE,
          type: "page",
        });
    const parsedRoute = await this.adapter.decodeRoute(currentRoute);
    // if the route is invalid, render the error page
    if (!parsedRoute) {
      const errorQuery: ErrorPageProps = {
        error: new Error(`Invalid route: ${currentRoute}`),
        //TODO: Use error package in the future
        code: 500,
      };
      return this.renderSpecialRoute(
        currentRoute.route,
        "error",
        {},
        errorQuery,
      );
    }
    const matchedRoute = await matchRouteWithPath(
      this.routeInfoFile.routes,
      parsedRoute.route,
    );
    const queryString = parseQuery(parsedRoute.route);
    if (!matchedRoute) {
      const errorQuery: ErrorPageProps = {
        error: new Error(`Route not found: ${parsedRoute}`),
        code: 404,
      };
      return await this.renderSpecialRoute(
        parsedRoute.route,
        "404",
        {},
        errorQuery,
      );
    }
    return {
      matchedRoute,
      queryString,
      component: matchedRoute.page as any,
      params: matchedRoute.params,
      path: matchedRoute.route,
      currentRoute: currentRoute,
      props: {},
    };
  }
}
