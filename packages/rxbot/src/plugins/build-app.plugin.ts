import { Compiler, RspackPluginInstance } from "@rspack/core";
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

  constructor(options: PluginOptions) {
    this.outputDir = options.outputDir;
    this.sourceDir = options.sourceDir;
  }

  apply(compiler: Compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      PLUGIN_NAME,
      async (compilation, callback) => {
        const botCompiler = new BotCompiler({
          rootDir: this.sourceDir,
          destinationDir: this.outputDir,
        });
        await botCompiler.compile();

        // generate the index file
        const fileContent = nunjucks.renderString(INDEX_FILE_TEMPLATE, {});
        await fs.writeFile(`${this.outputDir}/index.ts`, fileContent);
        callback();
      },
    );
  }
}
