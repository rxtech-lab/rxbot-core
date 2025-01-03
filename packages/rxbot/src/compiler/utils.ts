import {
  REACT_CLIENT_COMPONENT_TYPE,
  RouteInfoWithoutImport,
  RouteMetadata,
  RouteMetadataSchema,
} from "@rx-lab/common";
import { DuplicateRouteError } from "@rx-lab/errors";
import * as swc from "@swc/core";

export async function readMetadata(
  ast: swc.Module,
): Promise<RouteMetadata | undefined> {
  const metadata: Record<any, any> = {};
  for (const item of ast.body) {
    if (item.type === "ExportDeclaration") {
      const declaration = item.declaration;
      if (declaration.type === "VariableDeclaration") {
        for (const declarator of declaration.declarations) {
          if (
            declarator.id.type === "Identifier" &&
            declarator.id.value === "metadata"
          ) {
            if (declarator.init?.type === "ObjectExpression") {
              for (const prop of declarator.init.properties) {
                if (prop.type === "KeyValueProperty") {
                  const key: any = (prop.key as swc.Identifier).value;
                  metadata[key] = (prop.value as any).value;
                }
              }
            }
          }
        }
      }
    }
  }
  // make sure the metadata is valid
  return Object.keys(metadata).length !== 0
    ? RouteMetadataSchema.parse(metadata)
    : undefined;
}

/**
 * Check if the given file is a TypeScript file
 * @param filename
 */
export function isTypeScript(filename: string): boolean {
  return filename.endsWith(".ts") || filename.endsWith(".tsx");
}

/**
 * Parse the source code using swc.
 * @param type
 * @param code The source code
 */
export async function parseSourceCode(
  type: "typescript" | "javascript",
  code: string,
) {
  if (type === "typescript") {
    return swc.parse(code, {
      syntax: "typescript",
      tsx: true,
    });
  }

  return swc.parse(code, {
    syntax: "ecmascript",
    jsx: true,
  });
}

/**
 * Check if the given code is a client component
 *
 * @returns{boolean} True if the code is a client component, false otherwise
 *
 * @example
 * const code = `
 * "use client";
 *
 * export default function page() {
 *   return <div>This is a page</div>;
 * }
 * `
 *
 * const ast = parseSourceCode(code);
 * isClientComponent(ast); // true
 * @param ast The AST of the source code
 */
export async function isClientComponent(ast: swc.Module): Promise<boolean> {
  // use client must be defined at the top of the file
  // otherwise, treat it as a server component
  // if the file is empty, it is not a client component
  if (ast.body.length === 0) {
    return false;
  }

  const firstBody = ast.body[0]!;
  if (firstBody.type !== "ExpressionStatement") {
    return false;
  }

  // check its value
  if ("value" in firstBody.expression) {
    if (firstBody.expression.value === "use client") {
      return true;
    }
  }

  return false;
}

/**
 * Generate the client component tag
 * @param ast The AST of the source code
 *
 * @example
 * const code = `
 * "use client";
 *
 * export default function Page() {
 *   return <div>This is a page</div>;
 * }
 * `
 *
 * const ast = parseSourceCode(code);
 * generateClientComponentTag(ast); // "Page.$$typeof = Symbol(react.element.client)"
 */
export async function generateClientComponentTag(
  ast: swc.Module,
): Promise<string | undefined> {
  if (!(await isClientComponent(ast))) {
    return undefined;
  }

  // find type export
  const exportDefault = ast.body.filter(
    (node) =>
      node.type === "ExportDeclaration" ||
      node.type === "ExportDefaultDeclaration",
  ) as swc.ExportDefaultDeclaration[];

  if (exportDefault.length === 0) {
    return undefined;
  }

  let content = "";
  for (const node of exportDefault) {
    if ("declaration" in node) {
      const declaration = node.declaration as swc.FunctionDeclaration;
      if (declaration.type !== "FunctionDeclaration") {
        continue;
      }
      content += `${declaration.identifier.value}.$$typeof = Symbol("${REACT_CLIENT_COMPONENT_TYPE}");\n`;
    }

    if ("decl" in node) {
      const declaration = node.decl as swc.DefaultDecl;
      if (declaration.type !== "FunctionExpression") {
        continue;
      }

      if (!declaration.identifier) {
        continue;
      }
      content += `${declaration.identifier.value}.$$typeof = Symbol("${REACT_CLIENT_COMPONENT_TYPE}");\n`;
    }
  }

  if (content.length === 0) {
    return undefined;
  }

  return content;
}

export interface KeyAttribute {
  value: string;
}

/**
 * Extract the key attribute from the JSX elements
 * @param ast The AST of the source code
 * @returns The key attributes
 *
 * @example
 * // element
 * // <div>
 * //  <button key="1">Button 1</button>
 * //  <button key="2">Button 2</button>
 * // </div>
 * const keys = await extractJSXKeyAttributes(ast);
 * console.log(keys); // [{ value: "1" }, { value: "2" }]
 */
export async function extractJSXKeyAttributes(
  ast: swc.Module,
): Promise<KeyAttribute[]> {
  const keyAttributes: KeyAttribute[] = [];

  function traverse(node: swc.Node) {
    if (node.type === "JSXElement") {
      const jsxElement = node as swc.JSXElement;
      // biome-ignore lint/complexity/useOptionalChain: <explanation>
      if (jsxElement.opening && jsxElement.opening.attributes) {
        for (const attr of jsxElement.opening.attributes) {
          if (
            attr.type === "JSXAttribute" &&
            attr.name.type === "Identifier" &&
            attr.name.value === "key"
          ) {
            if (attr.value && attr.value.type === "JSXExpressionContainer") {
              const expression = attr.value.expression;
              if (expression.type === "StringLiteral") {
                keyAttributes.push({ value: expression.value });
              }
            }
          }
        }
      }
    }

    if (node.type === "JSXAttribute") {
      const jsxAttribute = node as swc.JSXAttribute;
      if (
        jsxAttribute.name.type === "Identifier" &&
        jsxAttribute.name.value === "key"
      ) {
        if (jsxAttribute.value && jsxAttribute.value.type === "StringLiteral") {
          keyAttributes.push({ value: jsxAttribute.value.value });
        }
      }
    }

    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        const child = (node as any)[key];
        if (child && typeof child === "object") {
          if (Array.isArray(child)) {
            // biome-ignore lint/complexity/noForEach: <explanation>
            child.forEach((item) => traverse(item));
          } else if (child.type) {
            traverse(child);
          }
        }
      }
    }
  }

  traverse(ast);
  return keyAttributes;
}

/**
 * Check if the given key is a duplicate key
 * @param oldMap
 * @param newMap
 */
export function checkDuplicateKeys(
  oldMap: Record<any, any>,
  newMap: Record<any, any>,
) {
  for (const key in newMap) {
    if (oldMap[key]) {
      //TODO: Throw custom error
      throw new Error(`Duplicate key found: ${key}`);
    }
  }
}

/**
 * Helper functions for handling Next.js route groups
 */

/**
 * Checks if a path route represents a route group
 * @param route The path route to check
 */
export const isRouteGroup = (route: string): boolean => {
  return route.startsWith("/(") && route.endsWith(")");
};

/**
 * Removes group segments from a route
 * @param route
 *
 * @example
 * removeGroupSegmentsFromRoute("/(user)/route") // "/route"
 * removeGroupSegmentsFromRoute("/(user)/route/(id)/route2") // "/route/route2"
 */
export const removeGroupSegmentsFromRoute = (route: string): string => {
  // Remove any segments that are wrapped in parentheses including the slashes around them
  const newRoute = route.replace(/\/\([^)]+\)/g, "");
  if (newRoute === "") {
    return "/";
  }
  return newRoute;
};

/**
 * 1. Iterate through each route in the routes array
 * 2. For each route, check if it is a group
 * 3. If the route is a group:
 *    - Take all child routes from the group's children array
 *    - Move these child routes to the same level as the group in the parent array
 *    - Remove the group route from the array, preserving its children in their new position
 * 4. Continue until all groups have been flattened
 *
 * @param routes
 */
export const processRouteGroup = (
  routes: RouteInfoWithoutImport[],
): RouteInfoWithoutImport[] => {
  const processRoutes = (
    routes: RouteInfoWithoutImport[],
  ): RouteInfoWithoutImport[] => {
    // Create a new array to store processed routes
    let processedRoutes: RouteInfoWithoutImport[] = [];

    // Iterate through each route
    for (let i = 0; i < routes.length; i++) {
      let currentRoute = routes[i];

      // Check if the current route is a group route
      if (isRouteGroup(currentRoute.route)) {
        // If it has subRoutes, process them and add them to the current level
        if (currentRoute.subRoutes?.length === 0) {
          processedRoutes.push({
            ...currentRoute,
            route: removeGroupSegmentsFromRoute(currentRoute.route),
          });
        }
        if ((currentRoute.subRoutes?.length ?? 0) > 0) {
          // Process nested subRoutes recursively
          const processedSubRoutes = processRoutes(currentRoute.subRoutes!).map(
            (r) => ({
              ...r,
              route: removeGroupSegmentsFromRoute(r.route),
            }),
          );
          processedRoutes = [...processedRoutes, ...processedSubRoutes];
        }
      } else {
        // If not a group route, process its subRoutes if they exist
        if (currentRoute.subRoutes) {
          const newSubRoutes = processRoutes(currentRoute.subRoutes);
          // check duplicate routes
          checkDuplicateRoutes(newSubRoutes);

          currentRoute.subRoutes = [];
          for (const subRoute of newSubRoutes) {
            if (subRoute.route === currentRoute.route) {
              currentRoute = subRoute;
              continue;
            }
            currentRoute.subRoutes?.push(subRoute);
          }
        }
        // Add the current route to processed routes
        processedRoutes.push({
          ...currentRoute,
          route: removeGroupSegmentsFromRoute(currentRoute.route),
        });
      }
    }

    return processedRoutes;
  };

  // Process the top-level routes
  return processRoutes(routes);
};

export const checkDuplicateRoutes = (routes: RouteInfoWithoutImport[]) => {
  const routeMap = new Map<string, boolean>();

  const check = (route: RouteInfoWithoutImport) => {
    const routeWithoutGroup = removeGroupSegmentsFromRoute(route.route);
    if (routeMap.has(routeWithoutGroup)) {
      throw new DuplicateRouteError(routeWithoutGroup);
    }
    routeMap.set(routeWithoutGroup, true);
    if (route.subRoutes) {
      checkDuplicateRoutes(route.subRoutes);
    }
  };
  routes.forEach(check);
};
