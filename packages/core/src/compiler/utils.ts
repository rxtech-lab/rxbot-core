import { REACT_CLIENT_COMPONENT_TYPE, RouteMetadata } from "@rx-lab/common";
import * as swc from "@swc/core";

export async function readMetadata(page: string): Promise<RouteMetadata> {
  const component = await import(page);
  return component.default.metadata;
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
  type: "typescript" | "javascript" = "typescript",
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
