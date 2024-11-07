import { Compiler, RspackPluginInstance } from "@rspack/core";
import { Logger } from "@rx-lab/common";
import fs from "fs/promises";

const PLUGIN_NAME = "RemoveTempPlugin";

interface PluginOptions {
  outputDir: string;
}
export class RemoveTempPlugin implements RspackPluginInstance {
  private readonly outputDir: string;

  constructor(options: PluginOptions) {
    this.outputDir = options.outputDir;
  }

  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tapAsync(
      PLUGIN_NAME,
      async (compilation, callback) => {
        // remove the temp folder
        Logger.log(`Removing temp folder ${this.outputDir}`, "blue");
        await fs.rm(this.outputDir, { recursive: true });
        callback();
      },
    );
  }
}
