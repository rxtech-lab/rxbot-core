// Example of how to create a browser-compatible generator
import {
  FileSystem,
  Options,
  PathOperations,
  TemplateGenerator,
} from "./render";
import { TemplateFile } from "./types";

interface RenderBrowserOptions extends Omit<Options, "fs" | "path" | "cwd"> {
  fileSystem: FileSystem;
}

export function createBrowserGenerator(opts: RenderBrowserOptions) {
  // This would need to be implemented with browser-compatible fs and path operations
  const browserFs: FileSystem = {
    readFileSync: (path: string, encoding: string) => {
      // Implement browser-compatible file reading
      throw new Error("Not implemented for browser");
    },
    writeFileSync: (path: string, content: string) => {
      // Implement browser-compatible file writing
      throw new Error("Not implemented for browser");
    },
    mkdirSync: (path: string, options?: { recursive?: boolean }) => {
      // Implement browser-compatible directory creation
      throw new Error("Not implemented for browser");
    },
    existsSync: (path: string) => {
      // Implement browser-compatible existence check
      throw new Error("Not implemented for browser");
    },
  };

  const browserPath: PathOperations = {
    join: (...paths: string[]) => paths.join("/"),
    dirname: (path: string) => path.split("/").slice(0, -1).join("/"),
    extname: (path: string) => {
      const parts = path.split(".");
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
    },
  };

  return new TemplateGenerator({
    ...opts,
    fs: browserFs,
    path: browserPath,
    cwd: () => "/",
    hookExecutor: {
      executeShell(command: string, cwd: string) {},
    },
  });
}

export async function render(
  opts: RenderBrowserOptions,
): Promise<TemplateFile> {
  const generator = createBrowserGenerator(opts);
  return generator.render();
}
