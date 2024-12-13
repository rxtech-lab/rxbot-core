import {
  Compiler,
  NormalModuleReplacementPlugin,
  RspackPluginInstance,
} from "@rspack/core";

interface Replacement {
  from: string;
  to: string;
}

/**
 * vercel environment plugin will replace some `@rx-lab/core` package with `@vercel/functions` package for the Vercel environment.
 */
export class VercelEnvironmentPlugin implements RspackPluginInstance {
  apply(compiler: Compiler) {
    const replacements: Replacement[] = [
      {
        from: "@rx-lab/core/functions",
        //TODO: Replace this to @rx-lab/core/functions/vercel when it's available
        to: "@vercel/functions",
      },
    ];

    for (const replacement of replacements) {
      new NormalModuleReplacementPlugin(
        new RegExp(replacement.from),
        (result) => {
          if (result.request === replacement.from) {
            result.request = replacement.to;
          }
        },
      ).apply(compiler);
    }
  }
}
