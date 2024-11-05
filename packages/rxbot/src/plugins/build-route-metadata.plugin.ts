import { Compiler, RspackPluginInstance } from "@rspack/core";
import { Compiler as BotCompiler } from "../compiler";

const PLUGIN_NAME = "BuildRouteMetadataPlugin";

interface PluginOptions {
  srcDir: string;
  outputDir: string;
}
export class BuildRouteMetadataPlugin implements RspackPluginInstance {
  private readonly srcDir: string;
  private readonly outputDir: string;

  constructor(options: PluginOptions) {
    this.srcDir = options.srcDir;
    this.outputDir = options.outputDir;
  }

  apply(compiler: Compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      PLUGIN_NAME,
      async (compilation, callback) => {
        const compiler = new BotCompiler({
          rootDir: this.srcDir,
          destinationDir: this.outputDir,
        });
        await compiler.compile();
        callback();
      },
    );
  }
}
