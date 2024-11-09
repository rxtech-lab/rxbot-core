import { execSync } from "child_process";
import { Options, TemplateGenerator } from "./render";
import { TemplateFile } from "./types";

export function createNodeGenerator(
  opts: Omit<Options, "fs" | "path" | "cwd">,
) {
  return new TemplateGenerator({
    ...opts,
    fs: require("fs"),
    path: require("path"),
    cwd: process.cwd,
    hookExecutor: {
      executeShell(command: string, cwd: string) {
        execSync(command, { stdio: "inherit", cwd });
      },
    },
  });
}

// Helper function to create a template generator
export async function render(
  opts: Omit<Options, "fs" | "path">,
): Promise<TemplateFile> {
  const generator = createNodeGenerator(opts);
  return generator.render();
}
