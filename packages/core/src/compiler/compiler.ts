import * as fs from "fs";
import path from "path";
import {
  ComponentKeyProps,
  Logger,
  RouteInfo,
  RouteInfoFile,
} from "@rx-lab/common";
import * as swc from "@swc/core";
import { glob } from "glob";
import {
  KeyAttribute,
  checkDuplicateKeys,
  extractJSXKeyAttributes,
  generateClientComponentTag,
  isTypeScript,
  parseSourceCode,
  readMetadata,
} from "./utils";

export interface CompilerOptions {
  /**
   * The root directory of the project
   */
  rootDir: string;
  /**
   * Output directory for the compiled source code
   */
  destinationDir?: string;
}

const PAGE_FILE_PATTERN = "**/page.tsx";
const ROUTE_METADATA_FILE = "route-metadata.json";
const OUTPUT_FILE_EXTENSION = ".js";
const DEFAULT_DESTINATION_DIR = "dist";

type RoutePath = {
  route: string;
  filePath?: string;
  subRoutes: RoutePath[];
  keys?: Record<string, KeyAttribute>;
};

export class Compiler {
  constructor(private readonly options: CompilerOptions) {}

  /**
   * Find every page.tsx file in the project
   */
  private findAvailablePages() {
    return glob.glob(PAGE_FILE_PATTERN, {
      cwd: this.options.rootDir,
    });
  }

  /**
   * Build the route information for the project
   * @returns The route information for the project
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * // { route: "/home", filePath: "/path/to/project/apps/home/page.tsx", subRoutes: [] }
   * const routeInfo = await compiler.buildRouteInfo();
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * // { route: "/home", filePath: "/path/to/project/apps/home/page.tsx", subRoutes: [{route: "/home/nested", filePath: "/path/to/project/apps/home/nested/page.tsx"}] }
   * const routeInfo = await compiler.buildRouteInfo();
   *
   */
  async buildRouteInfo(): Promise<RoutePath[]> {
    const pages = await this.findAvailablePages();
    return pages.reduce((routeInfo, page) => {
      const routePath = this.createRoutePath(page);
      return this.addRouteToTree(routeInfo, routePath);
    }, [] as RoutePath[]);
  }

  /**
   * Compile the source code for every page.tsx file in the project
   * and write the route information to a file.
   *
   * @returns The route information for the project
   */
  async compile(): Promise<RouteInfoFile> {
    const buildRouteInfo = await this.buildRouteInfo();
    let info: RouteInfo[] = [];
    // check if the output directory exists
    if (fs.existsSync(this.options.destinationDir ?? DEFAULT_DESTINATION_DIR)) {
      // remove the output directory
      Logger.log(
        `Removing ${this.options.destinationDir ?? DEFAULT_DESTINATION_DIR}`,
        "yellow",
      );
      fs.rmSync(this.options.destinationDir ?? DEFAULT_DESTINATION_DIR, {
        force: true,
        recursive: true,
      });
    }

    let keys: Record<string, ComponentKeyProps> = {};
    for (const route of buildRouteInfo) {
      const newInfo = await this.compileHelper(route, {});
      info = [...info, ...newInfo.routes];
      keys = { ...keys, ...newInfo.keys };
    }

    // create route-metadata.json file if it doesn't exist
    const outputPath = path.join(
      this.options.destinationDir ?? DEFAULT_DESTINATION_DIR,
      ROUTE_METADATA_FILE,
    );
    const file: RouteInfoFile = {
      routes: info,
      componentKeyMap: keys,
    };
    fs.writeFileSync(outputPath, JSON.stringify(file, null, 2));
    Logger.log(`Route metadata written to ${outputPath}`, "green");
    return file;
  }

  private async compileHelper(
    route: RoutePath,
    keys: Record<string, ComponentKeyProps>,
  ): Promise<{
    routes: RouteInfo[];
    keys: Record<string, ComponentKeyProps>;
  }> {
    let info: RouteInfo[] = [];
    let newKeys: Record<string, ComponentKeyProps> = {};
    // if the route has a file path, compile the source code
    // and add the route information to the list
    if (route.filePath) {
      Logger.log(`Compiling ${route.filePath}`, "blue");
      const outputFile = await this.buildSourceCode(
        path.join(this.options.rootDir, route.filePath),
      );
      outputFile.keys.forEach((key) => {
        if (newKeys[key.value]) {
          throw new Error(
            `Duplicate key found: ${key.value} in ${route.filePath}`,
          );
        }
        newKeys[key.value] = {
          route: route.route,
        };
      });
      const subPages = (
        await Promise.all(
          route.subRoutes.map((r) => this.compileHelper(r, keys)),
        )
      ).flat();

      const metadata = await readMetadata(outputFile.path);
      const routeInfo: RouteInfo = {
        route: route.route,
        filePath: outputFile.path,
        subRoutes: subPages.map((p) => p.routes).flat(),
        metadata,
      };
      info.push(routeInfo);
      subPages.forEach((p) => {
        checkDuplicateKeys(newKeys, p.keys);
        newKeys = { ...newKeys, ...p.keys };
      });
    } else {
      // if the route does not have a file path, compile the sub-routes
      const subPages = (
        await Promise.all(
          route.subRoutes.map((r) => this.compileHelper(r, keys)),
        )
      ).flat();
      info = [...info, ...subPages.map((p) => p.routes).flat()];
    }

    checkDuplicateKeys(newKeys, keys);
    return {
      routes: info,
      keys: { ...newKeys, ...keys },
    };
  }

  /**
   * Compile source code using SWC. Output will be written to the `dist` directory.
   * @param page The path to the page.tsx file
   * @returns The path to the compiled source code
   */
  private async buildSourceCode(page: string) {
    const outputFileName = path.basename(page, ".tsx") + OUTPUT_FILE_EXTENSION;
    const originalDir = path.dirname(page);
    const outputRootDir =
      this.options.destinationDir ||
      path.join(__dirname, DEFAULT_DESTINATION_DIR);
    const outputDir = path.join(
      outputRootDir,
      originalDir.replace(this.options.rootDir, ""),
    );
    const srcCode = fs.readFileSync(page, "utf-8");
    const outputFile = path.join(outputDir, outputFileName);
    const result = await swc.transformFile(page, {
      jsc: {
        target: "es2016",
        transform: {
          react: {
            runtime: "automatic",
          },
        },
      },
      module: {
        type: "commonjs",
      },
    });

    // check if the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    let codeToWrite = result.code;
    const ast = await parseSourceCode(
      isTypeScript(page) ? "typescript" : "javascript",
      srcCode,
    );
    const clientTag = await generateClientComponentTag(ast);
    if (clientTag) {
      codeToWrite = codeToWrite + clientTag;
    }
    fs.writeFileSync(outputFile, codeToWrite);
    Logger.log(`Compiled ${page} to ${outputFile}`, "blue");

    const keyRouteMapping = await extractJSXKeyAttributes(ast);

    return {
      code: result.code,
      path: outputFile,
      keys: keyRouteMapping,
    };
  }

  /**
   * Create a route path object from a file path
   * @param filePath
   * @private
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * // { route: "/home", filePath: "/path/to/project/apps/home/page.tsx", subRoutes: [] }
   * const routePath = compiler.createRoutePath("/path/to/project/apps/home/page.tsx");
   */
  private createRoutePath(filePath: string): RoutePath {
    const normalizedPath = filePath.replace(/\\/g, "/");
    const relativePath = normalizedPath
      .replace(this.options.rootDir, "")
      .replace(/^\//, "");
    const parts = relativePath.split("/");
    const routeParts = parts.slice(0, -1); // Exclude the 'page.tsx' part
    const route = "/" + routeParts.join("/");

    return {
      route,
      filePath: filePath,
      subRoutes: [],
    };
  }

  /**
   * Add a route path to the route tree.
   * If the route already exists in the tree, the file path will be updated.
   * @param tree
   * @param routePath
   * @private
   */
  private addRouteToTree(tree: RoutePath[], routePath: RoutePath): RoutePath[] {
    const parts = routePath.route.split("/").filter(Boolean);

    if (parts.length === 0) {
      return [...tree, routePath];
    }

    let currentTree = tree;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      currentPath += "/" + parts[i];
      const existingRouteIndex = currentTree.findIndex(
        (r) => r.route === currentPath,
      );

      if (existingRouteIndex === -1) {
        const newRoute: RoutePath = {
          route: currentPath,
          filePath: i === parts.length - 1 ? routePath.filePath : undefined,
          subRoutes: [],
        };
        currentTree.push(newRoute);
        currentTree = newRoute.subRoutes;
      } else {
        if (i === parts.length - 1) {
          currentTree[existingRouteIndex]!.filePath = routePath.filePath;
        }
        currentTree = currentTree[existingRouteIndex]!.subRoutes;
      }
    }

    return tree;
  }
}
