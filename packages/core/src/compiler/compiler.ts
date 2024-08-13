import * as fs from "fs";
import path from "path";
import { Logger, RouteInfo } from "@rx-lab/common";
import * as swc from "@swc/core";
import { glob } from "glob";
import { isDefaultExportAsync, readMetadata } from "./utils";

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
  async compile(): Promise<RouteInfo[]> {
    const buildRouteInfo = await this.buildRouteInfo();
    let info: RouteInfo[] = [];
    for (const route of buildRouteInfo) {
      const newInfo = await this.compileHelper(route);
      info = [...info, ...newInfo];
    }

    // create route-metadata.json file if it doesn't exist
    const outputPath = path.join(
      this.options.destinationDir ?? DEFAULT_DESTINATION_DIR,
      ROUTE_METADATA_FILE,
    );
    fs.writeFileSync(outputPath, JSON.stringify(info, null, 2));
    Logger.log(`Route metadata written to ${outputPath}`, "green");
    return info;
  }

  private async compileHelper(route: RoutePath): Promise<RouteInfo[]> {
    let info: RouteInfo[] = [];
    if (route.filePath) {
      Logger.log(`Compiling ${route.filePath}`, "blue");
      const outputFile = await this.buildSourceCode(
        path.join(this.options.rootDir, route.filePath),
      );
      const subPages = (
        await Promise.all(route.subRoutes.map((r) => this.compileHelper(r)))
      ).flat();

      const metadata = await readMetadata(outputFile.path);
      const routeInfo: RouteInfo = {
        route: route.route,
        filePath: outputFile.path,
        subRoutes: subPages,
        metadata,
        isAsync: isDefaultExportAsync(outputFile.code),
      };
      info.push(routeInfo);
    } else {
      const subPages = (
        await Promise.all(route.subRoutes.map((r) => this.compileHelper(r)))
      ).flat();
      info = [...info, ...subPages];
    }

    return info;
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
    const outputFile = path.join(outputDir, outputFileName);
    // Compile the source code
    const result = await swc.transformFile(page, {
      jsc: {
        target: "es2016",
      },
      module: {
        type: "commonjs",
      },
    });

    // check if the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputFile, result.code);
    Logger.log(`Compiled ${page} to ${outputFile}`, "blue");

    return {
      code: result.code,
      path: outputFile,
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
