import * as fs from "fs";
import { RouteMetadata } from "@rx-lab/common";
import * as swc from "@swc/core";

export async function readMetadata(page: string): Promise<RouteMetadata> {
  const component = await import(page);
  return component.default.metadata;
}

/**
 * Check if the default export of a code is an async function
 * @param code The code to check
 */
export function isDefaultExportAsync(code: string) {
  const ast = swc.parseSync(code, {
    syntax: "ecmascript", // or 'ecmascript' for JavaScript files
    jsx: true,
  });

  // Find the default export in the AST
  const defaultExport = ast.body.find(
    (node) => node.type === "ExportDefaultDeclaration",
  );

  if (!defaultExport) {
    return false; // No default export found
  }

  return (defaultExport as any).decl.async === true; // Default export is an async function
}
