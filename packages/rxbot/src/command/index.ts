import build from "./commands/build/build";
import runBuild from "./commands/build/build";
import deploy from "./commands/deploy/deploy";
import dev from "./commands/dev";

import { Config } from "./commands/deploy/deploy";

export { build, dev, deploy, runBuild };
export type { Config };
