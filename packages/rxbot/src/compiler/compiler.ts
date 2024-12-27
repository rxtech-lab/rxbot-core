import * as fs from "fs";
import assert from "node:assert";
import path from "path";
import {
  APP_FOLDER,
  DEFAULT_ROOT_ROUTE,
  Logger,
  ROUTE_METADATA_TS_FILE,
  RouteInfoFile,
  RouteInfoWithoutImport,
  RouteMetadata,
  SpecialRouteType,
} from "@rx-lab/common";
import * as swc from "@swc/core";
import { glob } from "glob";
import nunjucks from "nunjucks";
import {
  DEFAULT_404_PAGE,
  DEFAULT_ERROR_PAGE,
  DEFAULT_LAYOUT,
  DEFAULT_PAGE,
  METADATA_FILE_TEMPLATE,
} from "./templates";
import {
  generateClientComponentTag,
  isTypeScript,
  parseSourceCode,
  readMetadata,
} from "./utils";

export interface CompilerOptions {
  /**
   * The root directory of the project. Don't need to include the app folder
   */
  rootDir: string;
  /**
   * Output directory for the compiled source code
   */
  destinationDir?: string;
  /**
   * Has the adapter file
   */
  hasAdapterFile?: boolean;
  /**
   * The file system to use
   */
  fs?: typeof fs;
}

/**
 * The pattern to match page files
 */
const PAGE_FILE_PATTERN = "app/**/page.tsx";
/**
 * The file extension for the compiled source code
 */
const OUTPUT_FILE_EXTENSION = ".js";
/**
 * Default destination directory for the compiled source code
 */
const DEFAULT_DESTINATION_DIR = "dist";
/**
 * Folder where the API routes are stored
 */
const API_FOLDER = "api";

export type RoutePath = {
  route: string;
  page?: string;
  404?: string;
  error?: string;
  api?: string;
  layouts?: string[]; // Array of layout files, ordered from root to most specific
  subRoutes: RoutePath[];
};

type PageRelatedFile = {
  metadata?: RouteMetadata;
  path: string;
};

type ErrorRelatedFile = {
  path: string;
};

type NotFoundRelatedFile = {
  path: string;
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

//Add more special files here
export const SPECIAL_FILES = [
  "404.js",
  "page.js",
  "error.js",
  "route.js",
  "layout.js",
];

export class CompilerUtils {
  protected fs: typeof fs;

  constructor(
    protected readonly sourceDir: string,
    protected readonly destinationDir: string,
    fileSystem?: typeof fs,
  ) {
    this.fs = fileSystem || fs;
  }

  /**
   * Add default special pages to the root path if they don't exist.
   * @param routes
   *
   * @returns Updated routes with default special pages
   * @private
   */
  protected async addCompiledDefaultSpecialPagesToRoot(routes: RoutePath[]) {
    let copiedRoutes = [...routes];
    const rootRouteIndex = routes.findIndex(
      (r) => r.route === DEFAULT_ROOT_ROUTE,
    );

    const { outputDir, outputFileName } = this.getOutputPath(`page.tsx`);
    const rootRoute = copiedRoutes[rootRouteIndex] ?? {
      route: DEFAULT_ROOT_ROUTE,
      page: path.join(outputDir, APP_FOLDER, outputFileName),
      subRoutes: [],
    };

    // Add default root layout if not exists
    const outputLayoutPath = path.join(
      outputDir,
      APP_FOLDER,
      `layout${OUTPUT_FILE_EXTENSION}`,
    );
    await this.addAndCompileSpecialPages(
      outputLayoutPath,
      path.join(outputDir, APP_FOLDER),
      DEFAULT_LAYOUT,
    );
    rootRoute.layouts = rootRoute.layouts || [outputLayoutPath];

    if (!rootRoute.page) {
      const outputPagePath = path.join(
        outputDir,
        APP_FOLDER,
        `page${OUTPUT_FILE_EXTENSION}`,
      );
      await this.addAndCompileSpecialPages(
        outputPagePath,
        path.join(outputDir, APP_FOLDER),
        DEFAULT_PAGE,
      );
      rootRoute.page = outputPagePath;
    }

    if (!rootRoute["404"]) {
      const output404Path = path.join(
        outputDir,
        APP_FOLDER,
        `404${OUTPUT_FILE_EXTENSION}`,
      );
      await this.addAndCompileSpecialPages(
        output404Path,
        path.join(outputDir, APP_FOLDER),
        DEFAULT_404_PAGE,
      );
      rootRoute["404"] = output404Path;
    }

    if (!rootRoute.error) {
      const outputErrorPath = path.join(
        outputDir,
        APP_FOLDER,
        `error${OUTPUT_FILE_EXTENSION}`,
      );
      await this.addAndCompileSpecialPages(
        outputErrorPath,
        path.join(outputDir, APP_FOLDER),
        DEFAULT_ERROR_PAGE,
      );
      rootRoute.error = outputErrorPath;
    }

    if (rootRouteIndex === -1) {
      // write page.js file
      const outputPagePath = path.join(outputDir, APP_FOLDER, outputFileName);
      await this.addAndCompileSpecialPages(
        outputPagePath,
        path.join(outputDir, APP_FOLDER),
        DEFAULT_PAGE,
      );
      rootRoute.subRoutes = copiedRoutes;
      copiedRoutes = [rootRoute];
    } else {
      copiedRoutes[rootRouteIndex] = rootRoute;
    }
    return copiedRoutes;
  }

  /**
   * Get the output Javascript file path for a given file path.
   * @param filePath
   * @private
   */
  getOutputPath(filePath: string) {
    const extension = path.extname(filePath);
    const filenameWithoutExtension = path.basename(filePath, extension);
    const outputFileName = filenameWithoutExtension + OUTPUT_FILE_EXTENSION;
    const originalDir = path.dirname(filePath);
    const outputRootDir =
      this.destinationDir || path.join(__dirname, DEFAULT_DESTINATION_DIR);
    const outputDir = path.join(
      outputRootDir,
      originalDir.replace(this.sourceDir, ""),
    );

    return {
      outputDir,
      outputFileName,
    };
  }

  /**
   * Compile fileContent to the path.
   * @param path Compiled file path
   * @param outputDir Output directory
   * @param fileContent Compiled file content in TypeScript
   * @private
   */
  protected async addAndCompileSpecialPages(
    path: string,
    outputDir: string,
    fileContent: string,
  ) {
    const compiledFile = await swc.transform(fileContent, {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
        },
        transform: {
          react: {
            runtime: "automatic",
          },
        },
        target: "es2016",
      },
      module: {
        type: "commonjs",
      },
    });

    // Create all parent directories recursively
    const dirs = outputDir.split("/").filter(Boolean);
    let currentPath = "";
    for (const dir of dirs) {
      currentPath += "/" + dir;
      if (!this.fs.existsSync(currentPath)) {
        this.fs.mkdirSync(currentPath);
      }
    }

    this.fs.writeFileSync(path, compiledFile.code);
  }

  /**
   * Compile source code using SWC. This method transforms the source code but does not write it to a file.
   *
   * @param sourceCodePath The path to the source code file
   * @returns An object containing the compiled code, AST, and relevant file paths
   *
   * @example
   * const compiler = new CompilerUtils("/src", "/dist");
   * const result = await compiler.buildSourceCode("/src/app/home/page.tsx");
   * console.log(result.code); // Compiled JavaScript code
   * console.log(result.outputFilePath); // "/dist/app/home/page.js"
   */
  async buildSourceCode(
    sourceCodePath: string,
  ): Promise<BuildSourceCodeOutput> {
    const { outputDir, outputFileName } = this.getOutputPath(sourceCodePath);
    const srcCode = this.fs.readFileSync(sourceCodePath, "utf-8");
    const outputFile = path.join(outputDir, outputFileName);
    const result = await swc.transform(srcCode, {
      jsc: {
        target: "es2016",
        parser: isTypeScript(sourceCodePath)
          ? {
              tsx: true,
              syntax: "typescript",
            }
          : {
              jsx: true,
              syntax: "ecmascript",
            },
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
   * Build app-related files like `page.tsx`, `404.tsx`, etc. This method processes the compiled artifact
   * and extracts metadata from the AST.
   *
   * @param artifact The compiled source code artifact
   * @param fileType The type of the file (e.g., "page")
   * @returns An object containing the file metadata and output path
   *
   * @example
   * const compiler = new CompilerUtils("/src", "/dist");
   * const artifact = await compiler.buildSourceCode("/src/app/home/page.tsx");
   * const result = await compiler.buildAppRelatedFiles(artifact, "page");
   * console.log(result.metadata); // Extracted metadata
   * console.log(result.path); // "/dist/app/home/page.js"
   */
  async buildAppRelatedFiles(
    artifact: BuildSourceCodeOutput | undefined,
    fileType: AppRelatedFileType,
  ) {
    return {
      metadata: artifact ? await readMetadata(artifact.ast) : undefined,
    };
  }

  /**
   * Get all TypeScript or TypeScript React files in a directory.
   *
   * @param dir The directory to search
   * @returns An array of file paths
   *
   * @example
   * const compiler = new CompilerUtils("/src", "/dist");
   * const files = await compiler.getAllTsFilesInDir("/src");
   * console.log(files); // ["app/home/page.tsx", "components/Button.ts", ...]
   */
  private async getAllTsFilesInDir(dir: string) {
    return glob.glob("**/*.ts*", {
      cwd: dir,
    });
  }

  /**
   * Build all files in the source directory except app-related files.
   * This method compiles each file and writes the output to the destination directory.
   *
   * @returns An array of BuildSourceCodeOutput objects for each compiled file
   *
   * @example
   * const compiler = new CompilerUtils("/src", "/dist");
   * const results = await compiler.buildAllFilesInSourceDir();
   * console.log(results.length); // Number of compiled files
   * console.log(results[0].outputFilePath); // Path to the first compiled file
   */
  async buildAllFilesInSourceDir() {
    let tsFiles = await this.getAllTsFilesInDir(this.sourceDir);
    tsFiles = tsFiles.filter((t) => !t.includes(".spec."));
    return await Promise.all(
      tsFiles.map(async (file) => {
        const result = await this.buildSourceCode(
          path.join(this.sourceDir, file),
        );
        Logger.log(`Compiling ${file} to ${result.outputFilePath}`, "blue");
        if (!this.fs.existsSync(result.outputDir)) {
          this.fs.mkdirSync(result.outputDir, { recursive: true });
        }
        this.fs.writeFileSync(result.outputFilePath, result.code);
        return result;
      }),
    );
  }

  /**
   * Merge routes with the same route.
   * @param routes
   * @private
   */
  protected mergeDuplicateRoutes(
    routes: RouteInfoWithoutImport[],
  ): RouteInfoWithoutImport[] {
    // Create a map to group routes by their path
    const routeMap = new Map<string, RouteInfoWithoutImport>();

    for (const route of routes) {
      const existingRoute = routeMap.get(route.route);

      if (existingRoute) {
        // Merge the routes if there's an existing route with the same path
        routeMap.set(route.route, {
          route: route.route,
          page: route.page || existingRoute.page,
          "404": route["404"] || existingRoute["404"],
          error: route.error || existingRoute.error,
          api: route.api || existingRoute.api,
          layouts: route.layouts || existingRoute.layouts,
          metadata: route.metadata || existingRoute.metadata,
          // Recursively merge subroutes
          subRoutes: this.mergeDuplicateRoutes([
            ...(existingRoute.subRoutes || []),
            ...(route.subRoutes || []),
          ]),
        });
      } else {
        // If no existing route, add it to the map with recursively merged subroutes
        routeMap.set(route.route, {
          ...route,
          subRoutes: this.mergeDuplicateRoutes(route.subRoutes || []),
        });
      }
    }

    // Convert the map back to an array
    return Array.from(routeMap.values());
  }

  /**
   * Put routes under the root path.
   * @param routes
   * @protected
   */
  protected putRoutesUnderRoot(
    routes: RouteInfoWithoutImport[],
  ): RouteInfoWithoutImport[] {
    const rootRoute = routes.find((r) => r.route === DEFAULT_ROOT_ROUTE);
    const routesNotRoot = routes.filter((r) => r.route !== DEFAULT_ROOT_ROUTE);
    assert(rootRoute, "Root route not found");
    // if routes are already under the root path, return them
    if ((rootRoute.subRoutes?.length ?? 0) > 0) {
      return routes;
    }
    return [
      {
        ...rootRoute,
        subRoutes: routesNotRoot,
      },
    ];
  }
}

export class Compiler extends CompilerUtils {
  constructor(private readonly options: CompilerOptions) {
    const isAbsoluteRootDir = path.isAbsolute(options.rootDir);
    const isAbsoluteDestinationDir = path.isAbsolute(
      options.destinationDir ?? DEFAULT_DESTINATION_DIR,
    );
    let rootDir = options.rootDir;
    let destinationDir: string =
      options.destinationDir ?? DEFAULT_DESTINATION_DIR;

    if (!isAbsoluteRootDir) {
      // join the rootDir with the current working directory
      rootDir = path.join(process.cwd(), options.rootDir);
    }

    if (!isAbsoluteDestinationDir) {
      // join the destinationDir with the current working directory
      destinationDir = path.join(process.cwd(), destinationDir);
    }

    super(rootDir, destinationDir, options.fs);
  }

  /**
   * Find every page.tsx file in the project.
   *
   * @returns An array of file paths for all page.tsx files
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * const artifacts = await compiler.buildAllFilesInSourceDir();
   * const pages = await compiler.findAvailablePages(artifacts);
   * console.log(pages); // ["app/home/page.js", "app/about/page.js", ...]
   */
  private findAvailablePages(artifacts: BuildSourceCodeOutput[]) {
    return artifacts
      .filter((a) =>
        SPECIAL_FILES.some((file) => a.outputFilePath.endsWith(file)),
      )
      .map((a) => a.outputFilePath);
  }

  /**
   * Build the route information for the project.
   * This method scans the project structure and creates a tree of routes based on the page.tsx files.
   *
   * @returns An array of RoutePath objects representing the project's route structure
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * const routeInfo = await compiler.buildRouteInfo();
   * console.log(JSON.stringify(routeInfo, null, 2));
   * // Output:
   * // [
   * //   {
   * //     "route": "/home",
   * //     "page": "/path/to/project/app/home/page.tsx",
   * //     "subRoutes": []
   * //   },
   * //   {
   * //     "route": "/about",
   * //     "page": "/path/to/project/app/about/page.tsx",
   * //     "subRoutes": [
   * //       {
   * //         "route": "/about/team",
   * //         "page": "/path/to/project/app/about/team/page.tsx",
   * //         "subRoutes": []
   * //       }
   * //     ]
   * //   }
   * // ]
   */
  async buildRouteInfo(
    artifacts: BuildSourceCodeOutput[],
  ): Promise<RoutePath[]> {
    const pages = this.findAvailablePages(artifacts);
    return pages.reduce((routeInfo, page) => {
      const routePath = this.createRoutePath(page, artifacts);
      return this.addRouteToTree(routeInfo, routePath);
    }, [] as RoutePath[]);
  }

  /**
   * Compile the source code for every page.tsx file in the project
   * and write the route information to a file.
   * This method orchestrates the entire compilation process, including
   * building all files, generating route information, and writing metadata.
   *
   * @returns The complete route information for the project
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project", destinationDir: "/path/to/output" });
   * const routeInfo = await compiler.compile();
   * console.log(JSON.stringify(routeInfo, null, 2));
   * // Output:
   * // {
   * //   "routes": [
   * //     {
   * //       "route": "/home",
   * //       "page": "/path/to/output/app/home/page.js",
   * //       "subRoutes": [],
   * //       "metadata": { ... }
   * //     },
   * //     ...
   * //   ]
   * // }
   */
  async compile(): Promise<RouteInfoFile> {
    if (fs.existsSync(this.destinationDir)) {
      // remove the output directory
      Logger.log(`Removing ${this.destinationDir}`, "yellow");
      fs.rmSync(this.destinationDir, {
        force: true,
        recursive: true,
      });
    }
    const artifacts = await this.buildAllFilesInSourceDir();
    // check if the output directory exists
    let info: RouteInfoWithoutImport[] = [];
    // if root path doesn't contain special pages, add default ones
    const buildRouteInfo = await this.buildRouteInfo(artifacts);
    const updatedRoutes =
      await this.addCompiledDefaultSpecialPagesToRoot(buildRouteInfo);

    const rootRoute = updatedRoutes.find((r) => r.route === DEFAULT_ROOT_ROUTE);

    for (const route of updatedRoutes) {
      // we need to make sure the parent holds all special pages (404, error, etc.)
      const newInfo = await this.compileHelper(route, artifacts, rootRoute);
      info = [...info, ...newInfo.routes];
    }

    // add rootRoute to the info if it's not there
    if (!info.find((r) => r.route === DEFAULT_ROOT_ROUTE)) {
      const rootInfo: RouteInfoWithoutImport = {
        "404": rootRoute!["404"]!,
        error: rootRoute!.error!,
        page: rootRoute!.page!,
        api: rootRoute!.api!,
        layouts: rootRoute!.layouts!,
        route: DEFAULT_ROOT_ROUTE,
        subRoutes: [...info],
      };
      info = [rootInfo];
    }

    // merge routes with the same route
    info = this.mergeDuplicateRoutes(info);
    // put all routes under the root path
    info = this.putRoutesUnderRoot(info);

    // create route-metadata.json file if it doesn't exist
    const outputPath = path.join(this.destinationDir, ROUTE_METADATA_TS_FILE);
    const file: RouteInfoFile = {
      routes: info as any,
    };
    nunjucks.configure({ autoescape: false });
    const output = nunjucks.renderString(METADATA_FILE_TEMPLATE, {
      ...file,
      hasAdapterFile: this.options.hasAdapterFile,
    });
    this.fs.writeFileSync(outputPath, output);

    Logger.log(`Route metadata written to ${outputPath}`, "green");
    return file;
  }

  /**
   * Helper method to recursively compile routes and their sub-routes.
   * This method is used internally by the compile() method to process the route tree.
   *
   * @param route The current route being processed
   * @param artifacts The compiled artifacts for all source files
   * @param parent The parent route (if any)
   * @returns An object containing the compiled route information
   *
   * @example
   * // This method is typically not called directly, but used internally by compile()
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * const artifacts = await compiler.buildAllFilesInSourceDir();
   * const routeInfo = await compiler.compileHelper(
   *   { route: "/home", page: "/path/to/project/app/home/page.tsx", subRoutes: [] },
   *   artifacts
   * );
   * console.log(routeInfo);
   * // Output: { routes: [{ route: "/home", page: "/path/to/output/app/home/page.js", ... }] }
   */
  private async compileHelper(
    route: RoutePath,
    artifacts: BuildSourceCodeOutput[],
    parent?: RoutePath,
  ): Promise<{
    routes: RouteInfoWithoutImport[];
  }> {
    let info: RouteInfoWithoutImport[] = [];

    const notFoundPage = route["404"] ?? parent?.["404"];
    const errorPage = route.error ?? parent?.error;
    const layoutPage = route.layouts ?? parent?.layouts;
    const outputPageFile = await this.buildAppRelatedFiles(
      artifacts.find((a) => a.outputFilePath === route.page)!,
      "page",
    );
    const subPages = (
      await Promise.all(
        route.subRoutes.map((r) =>
          this.compileHelper(r, artifacts, {
            ...route,
            "404": notFoundPage,
            error: errorPage,
            layouts: layoutPage,
          }),
        ),
      )
    ).flat();

    if (route.page || route["404"] || route.error || route.layouts) {
      const routeInfo: RouteInfoWithoutImport = {
        route: route.route,
        // use self 404 or parent 404
        "404": notFoundPage!,
        // use self error or parent error
        error: errorPage!,
        page: route.page,
        subRoutes: subPages.flatMap((p) => p.routes),
        layouts: layoutPage,
        metadata: outputPageFile.metadata,
      };
      info.push(routeInfo);
    } else if (route.api) {
      const routeInfo: RouteInfoWithoutImport = {
        route: route.route,
        subRoutes: subPages.flatMap((p) => p.routes),
        api: route.api,
      };
      info.push(routeInfo);
    } else {
      // if the route does not have a file path, compile the sub-routes
      const subPages = (
        await Promise.all(
          route.subRoutes.map((r) =>
            this.compileHelper(r, artifacts, {
              ...route,
              "404": notFoundPage,
              error: errorPage,
              layouts: layoutPage,
            }),
          ),
        )
      ).flat();
      info = [...info, ...subPages.flatMap((p) => p.routes)];
    }

    return {
      routes: info,
    };
  }

  /**
   * Find special pages like 404.tsx and error.tsx in the project by the file path.
   * @param route
   * @param type
   * @param artifacts The compiled artifacts for all source files
   * @private
   *
   * @example
   * const artifacts = await compiler.buildAllFilesInSourceDir();
   * this.findSpecialPages("/path/to/project/app/home/page.tsx",artifacts ,"404"); // "/path/to/project/app/404.js"
   * this.findSpecialPages("/path/to/project/app/home/page.tsx",artifacts, "error"); // "/path/to/project/app/error.js"
   * this.findSpecialPages("/path/to/project/app/home/nested/page.tsx",artifacts ,"404"); // undefined
   *
   */
  private findSpecialPages(
    route: string,
    artifacts: BuildSourceCodeOutput[],
    type: SpecialRouteType,
  ) {
    let specialPage: string | undefined;
    if (type === "error") {
      specialPage = path.join(
        this.destinationDir,
        APP_FOLDER,
        route,
        "error.js",
      );
    }

    if (type === "404") {
      specialPage = path.join(this.destinationDir, APP_FOLDER, route, "404.js");
    }

    if (type === "page") {
      specialPage = path.join(
        this.destinationDir,
        APP_FOLDER,
        route,
        "page.js",
      );
    }

    if (type === "api") {
      specialPage = path.join(
        this.destinationDir,
        APP_FOLDER,
        route,
        "route.js",
      );
    }

    if (type === "layout") {
      specialPage = path.join(
        this.destinationDir,
        APP_FOLDER,
        route,
        "layout.js",
      );
    }

    const specialPageExists = artifacts.find(
      (a) => path.relative(a.outputFilePath, specialPage ?? "") === "",
    );
    return specialPageExists ? specialPage : undefined;
  }

  /**
   * Create a route path object from a file path.
   * This method parses a file path and generates the corresponding route structure.
   *
   * @param filePath The full path to a page.js file
   * @param artifacts The compiled artifacts for all source files
   * @returns A RoutePath object representing the route
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * const artifacts = await compiler.buildAllFilesInSourceDir();
   * const routePath = compiler.createRoutePath("/path/to/project/app/home/page.tsx", artifacts);
   * console.log(routePath);
   * // Output: { route: "/home", page: "/path/to/project/app/home/page.tsx", subRoutes: [] }
   */
  private createRoutePath(
    filePath: string,
    artifacts: BuildSourceCodeOutput[],
  ): RoutePath {
    const normalizedPath = filePath.replace(/\\/g, "/");
    const relativePath = path.relative(this.destinationDir, normalizedPath);
    const parts = relativePath.split("/");
    const routeParts = parts.slice(0, -1); // Exclude the file name part
    const route = `/${routeParts.filter((r) => r !== APP_FOLDER).join("/")}`;

    // Find all parent routes to check for layouts, including the root app folder
    const parentRoutes = routeParts.reduce((acc, part, index) => {
      // Include the APP_FOLDER for the root layout
      const currentPath = routeParts.slice(0, index + 1).join("/");
      acc.push(currentPath);
      return acc;
    }, [] as string[]);

    // Find layouts for current route and all parent routes
    const layouts = parentRoutes
      .map((parentRoute) => {
        if (parentRoute.startsWith(APP_FOLDER)) {
          return this.findSpecialPages(
            parentRoute.replace(APP_FOLDER, ""),
            artifacts,
            "layout",
          );
        }
        return this.findSpecialPages(parentRoute, artifacts, "layout");
      })
      .filter((layout): layout is string => layout !== undefined);

    const pageFile = this.findSpecialPages(route, artifacts, "page");
    const notFoundPage = this.findSpecialPages(route, artifacts, "404");
    const errorPage = this.findSpecialPages(route, artifacts, "error");
    const apiRoute = this.findSpecialPages(route, artifacts, "api");

    if (apiRoute) {
      return {
        route,
        api: apiRoute,
        subRoutes: [],
      };
    }

    return {
      route,
      page: pageFile,
      subRoutes: [],
      404: notFoundPage,
      error: errorPage,
      layouts: layouts.length > 0 ? layouts : undefined,
    };
  }

  /**
   * Add a route path to the route tree.
   * This method updates the existing route tree with a new route,
   * creating nested structures as necessary.
   *
   * @param tree The current route tree
   * @param routePath The new route path to add
   * @returns The updated route tree
   *
   * @example
   * const compiler = new Compiler({ rootDir: "/path/to/project" });
   * let tree: RoutePath[] = [];
   * tree = compiler.addRouteToTree(tree, {
   *   route: "/home",
   *   page: "/path/to/project/app/home/page.tsx",
   *   subRoutes: []
   * });
   * tree = compiler.addRouteToTree(tree, {
   *   route: "/about/team",
   *   page: "/path/to/project/app/about/team/page.tsx",
   *   subRoutes: []
   * });
   * console.log(JSON.stringify(tree, null, 2));
   * // Output:
   * // [
   * //   {
   * //     "route": "/home",
   * //     "page": "/path/to/project/app/home/page.tsx",
   * //     "subRoutes": []
   * //   },
   * //   {
   * //     "route": "/about",
   * //     "subRoutes": [
   * //       {
   * //         "route": "/about/team",
   * //         "page": "/path/to/project/app/about/team/page.tsx",
   * //         "subRoutes": []
   * //       }
   * //     ]
   * //   }
   * // ]
   */
  private addRouteToTree(tree: RoutePath[], routePath: RoutePath): RoutePath[] {
    const parts = routePath.route.split("/").filter(Boolean);

    if (parts.length === 0) {
      return [...tree, routePath];
    }

    let currentTree = tree;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      currentPath += `/${parts[i]}`;
      const existingRouteIndex = currentTree.findIndex(
        (r) => r.route === currentPath,
      );

      if (existingRouteIndex === -1) {
        const newRoute: RoutePath = {
          ...routePath,
          route: currentPath,
          page: i === parts.length - 1 ? routePath.page : undefined,
          subRoutes: [],
        };
        currentTree.push(newRoute);
        currentTree = newRoute.subRoutes;
      } else {
        if (i === parts.length - 1) {
          currentTree[existingRouteIndex]!.page = routePath.page;
          currentTree[existingRouteIndex]!["404"] = routePath["404"];
          currentTree[existingRouteIndex]!.error = routePath.error;
          currentTree[existingRouteIndex]!.api = routePath.api;
          currentTree[existingRouteIndex]!.layouts = routePath.layouts;
        }
        currentTree = currentTree[existingRouteIndex]!.subRoutes;
      }
    }

    return tree;
  }
}
