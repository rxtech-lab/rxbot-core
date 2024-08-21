import * as fs from "fs";
import path from "path";
import { APP_FOLDER, Logger, RouteInfo, RouteInfoFile } from "@rx-lab/common";
import * as swc from "@swc/core";
import { glob } from "glob";
import {
  KeyAttribute,
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

const PAGE_FILE_PATTERN = "app/**/page.tsx";
const ROUTE_METADATA_FILE = "route-metadata.json";
const OUTPUT_FILE_EXTENSION = ".js";
const DEFAULT_DESTINATION_DIR = "dist";

type RoutePath = {
  route: string;
  filePath?: string;
  subRoutes: RoutePath[];
  keys?: Record<string, KeyAttribute>;
};

export interface BuildSourceCodeOutput {
  /**
   * Built source code
   */
  code: string;
  /**
   * The abstract syntax tree of the source code
   */
  ast: swc.Module;
  /**
   * The path to the compiled source code
   */
  outputFilePath: string;
  /**
   * The directory where the compiled source code is located
   */
  outputDir: string;
  /**
   * The path to the source code
   */
  sourceCodePath: string;
}

export type AppRelatedFileType = "page";

export class CompilerUtils {
  constructor(
    private readonly sourceDir: string,
    private readonly destinationDir: string,
  ) {}

  /**
   * Compile source code using SWC. Note that this method does not write the compiled code to a file.
   * @param sourceCodePath The path to the source code
   * @returns The path to the compiled source code
   */
  async buildSourceCode(
    sourceCodePath: string,
  ): Promise<BuildSourceCodeOutput> {
    const outputFileName =
      path.basename(sourceCodePath, ".tsx") + OUTPUT_FILE_EXTENSION;
    const originalDir = path.dirname(sourceCodePath);
    const outputRootDir =
      this.destinationDir || path.join(__dirname, DEFAULT_DESTINATION_DIR);
    const outputDir = path.join(
      outputRootDir,
      originalDir.replace(this.sourceDir, ""),
    );
    const srcCode = fs.readFileSync(sourceCodePath, "utf-8");
    const outputFile = path.join(outputDir, outputFileName);
    const result = await swc.transformFile(sourceCodePath, {
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

    let codeToWrite = result.code;
    const ast = await parseSourceCode(
      isTypeScript(sourceCodePath) ? "typescript" : "javascript",
      srcCode,
    );
    const clientTag = await generateClientComponentTag(ast);
    if (clientTag) {
      codeToWrite = codeToWrite + clientTag;
    }

    return {
      code: codeToWrite,
      ast,
      sourceCodePath,
      outputFilePath: outputFile,
      outputDir,
    };
  }

  /**
   * Build app related files like `page.tsx`, `404.tsx`, etc.
   * @param artifact The source code artifact
   * @param fileType The type of the file
   */
  async buildAppRelatedFiles(
    artifact: BuildSourceCodeOutput,
    fileType: AppRelatedFileType,
  ) {
    return {
      metadata: await readMetadata(artifact.ast),
      path: artifact.outputFilePath,
    };
  }

  /**
   * Get all tsx or ts files in a directory
   * @param dir
   * @private
   */
  private async getAllTsFilesInDir(dir: string) {
    return glob.glob("**/*.ts*", {
      cwd: dir,
    });
  }

  /**
   * Build all files in the source directory except app related files.
   */
  async buildAllFilesInSourceDir() {
    const tsFiles = await this.getAllTsFilesInDir(this.sourceDir);
    return await Promise.all(
      tsFiles.map(async (file) => {
        Logger.log(`Compiling ${file}`, "blue");
        const result = await this.buildSourceCode(
          path.join(this.sourceDir, file),
        );
        if (!fs.existsSync(result.outputDir)) {
          fs.mkdirSync(result.outputDir, { recursive: true });
        }
        fs.writeFileSync(result.outputFilePath, result.code);
        return result;
      }),
    );
  }
}

export class Compiler extends CompilerUtils {
  constructor(private readonly options: CompilerOptions) {
    super(
      options.rootDir,
      options.destinationDir ??
        path.join(options.rootDir, DEFAULT_DESTINATION_DIR),
    );
  }

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

    const artifacts = await this.buildAllFilesInSourceDir();

    for (const route of buildRouteInfo) {
      const newInfo = await this.compileHelper(route, artifacts);
      info = [...info, ...newInfo.routes];
    }

    // create route-metadata.json file if it doesn't exist
    const outputPath = path.join(
      this.options.destinationDir ?? DEFAULT_DESTINATION_DIR,
      ROUTE_METADATA_FILE,
    );
    const file: RouteInfoFile = {
      routes: info,
    };
    fs.writeFileSync(outputPath, JSON.stringify(file, null, 2));
    Logger.log(`Route metadata written to ${outputPath}`, "green");
    return file;
  }

  private async compileHelper(
    route: RoutePath,
    artifacts: BuildSourceCodeOutput[],
  ): Promise<{
    routes: RouteInfo[];
  }> {
    let info: RouteInfo[] = [];

    // if the route has a file path, compile the source code
    // and add the route information to the list
    if (route.filePath) {
      const outputPageFile = await this.buildAppRelatedFiles(
        artifacts.find(
          (a) =>
            a.sourceCodePath ===
            path.join(this.options.rootDir, route.filePath ?? ""),
        )!,
        "page",
      );
      const subPages = (
        await Promise.all(
          route.subRoutes.map((r) => this.compileHelper(r, artifacts)),
        )
      ).flat();

      const routeInfo: RouteInfo = {
        route: route.route,
        filePath: outputPageFile.path,
        subRoutes: subPages.map((p) => p.routes).flat(),
        metadata: outputPageFile.metadata,
      };
      info.push(routeInfo);
    } else {
      // if the route does not have a file path, compile the sub-routes
      const subPages = (
        await Promise.all(
          route.subRoutes.map((r) => this.compileHelper(r, artifacts)),
        )
      ).flat();
      info = [...info, ...subPages.map((p) => p.routes).flat()];
    }

    return {
      routes: info,
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
    const route = "/" + routeParts.filter((r) => r !== APP_FOLDER).join("/");

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
