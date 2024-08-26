import * as fs from "fs";
import path from "path";
import {
  APP_FOLDER,
  DEFAULT_ROOT_ROUTE,
  Logger,
  ROUTE_METADATA_FILE,
  RouteInfo,
  RouteInfoFile,
  RouteMetadata,
  SpecialRouteType,
} from "@rx-lab/common";
import * as swc from "@swc/core";
import { glob } from "glob";
import {
  DEFAULT_404_PAGE,
  DEFAULT_ERROR_PAGE,
  DEFAULT_PAGE,
} from "./templates";
import {
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
const OUTPUT_FILE_EXTENSION = ".js";
const DEFAULT_DESTINATION_DIR = "dist";

type RoutePath = {
  route: string;
  page?: string;
  404?: string;
  error?: string;
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
export const SPECIAL_FILES = ["404.js", "page.js", "error.js"];

export class CompilerUtils {
  constructor(
    protected readonly sourceDir: string,
    protected readonly destinationDir: string,
  ) {}

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
  private async addAndCompileSpecialPages(
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
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path, compiledFile.code);
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
    // check if the output directory exists
    let info: RouteInfo[] = [];
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
      const rootInfo: RouteInfo = {
        "404": rootRoute!["404"]!,
        error: rootRoute!.error!,
        page: rootRoute!.page!,
        route: DEFAULT_ROOT_ROUTE,
        subRoutes: [...info],
      };
      info = [rootInfo];
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
    routes: RouteInfo[];
  }> {
    let info: RouteInfo[] = [];

    const notFoundPage = route["404"] ?? parent?.["404"];
    const errorPage = route.error ?? parent?.error;
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
          }),
        ),
      )
    ).flat();

    if (route.page || route["404"] || route.error) {
      const routeInfo: RouteInfo = {
        route: route.route,
        // use self 404 or parent 404
        "404": notFoundPage!,
        // use self error or parent error
        error: errorPage!,
        page: route.page,
        subRoutes: subPages.flatMap((p) => p.routes),
        metadata: outputPageFile.metadata,
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
        this.options.destinationDir ?? DEFAULT_DESTINATION_DIR,
        APP_FOLDER,
        route,
        "error.js",
      );
    }

    if (type === "404") {
      specialPage = path.join(
        this.options.destinationDir ?? DEFAULT_DESTINATION_DIR,
        APP_FOLDER,
        route,
        "404.js",
      );
    }

    if (type === "page") {
      specialPage = path.join(
        this.options.destinationDir ?? DEFAULT_DESTINATION_DIR,
        APP_FOLDER,
        route,
        "page.js",
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
    const relativePath = normalizedPath
      .replace(this.destinationDir, "")
      .replace(/^\//, "");
    const parts = relativePath.split("/");
    const routeParts = parts.slice(0, -1); // Exclude the file name part
    const route = `/${routeParts.filter((r) => r !== APP_FOLDER).join("/")}`;

    const pageFile = this.findSpecialPages(route, artifacts, "page");
    const notFoundPage = this.findSpecialPages(route, artifacts, "404");
    const errorPage = this.findSpecialPages(route, artifacts, "error");

    return {
      route,
      page: pageFile,
      subRoutes: [],
      404: notFoundPage,
      error: errorPage,
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
        }
        currentTree = currentTree[existingRouteIndex]!.subRoutes;
      }
    }

    return tree;
  }
}
