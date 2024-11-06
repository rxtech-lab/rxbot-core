import path from "path";
import { Compiler, RspackPluginInstance } from "@rspack/core";
import { Logger } from "@rx-lab/common";
import fs from "fs/promises";
import nunjucks from "nunjucks";
import { Compiler as BotCompiler } from "../compiler";
import { INDEX_FILE_TEMPLATE } from "../compiler/templates";

const PLUGIN_NAME = "BuildAppPlugin";

interface PluginOptions {
  sourceDir: string;
  outputDir: string;
}
export class BuildAppPlugin implements RspackPluginInstance {
  private readonly sourceDir: string;
  private readonly outputDir: string;
  private lastCompileTime = 0;
  private isFirstRun = true;

  constructor(options: PluginOptions) {
    this.outputDir = options.outputDir;
    this.sourceDir = options.sourceDir;
  }

  private async hasSourceChanged(): Promise<boolean> {
    try {
      // Get all files in source directory recursively
      const getAllFiles = async (dir: string): Promise<string[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(
          entries.map((entry) => {
            const res = path.resolve(dir, entry.name);
            return entry.isDirectory() ? getAllFiles(res) : res;
          }),
        );
        return files.flat();
      };

      const files = await getAllFiles(this.sourceDir);

      // Check if any file has been modified since last compile
      for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.mtimeMs > this.lastCompileTime) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking source changes:", error);
      // If there's an error checking, return true to trigger recompile
      return true;
    }
  }

  apply(compiler: Compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      PLUGIN_NAME,
      async (compilation, callback) => {
        Logger.log("Building app...", "red");
        if (this.isFirstRun || (await this.hasSourceChanged())) {
          // remove the output directory
          const botCompiler = new BotCompiler({
            rootDir: this.sourceDir,
            destinationDir: this.outputDir,
          });
          await botCompiler.compile();

          // generate the index file
          const fileContent = nunjucks.renderString(INDEX_FILE_TEMPLATE, {});
          await fs.writeFile(`${this.outputDir}/index.ts`, fileContent);

          this.lastCompileTime = Date.now();
          this.isFirstRun = false;
          callback();
        } else {
          Logger.log("No changes detected, skipping build...", "yellow");
          callback();
        }
      },
    );
  }
}
