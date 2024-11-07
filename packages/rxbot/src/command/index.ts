import build from "./commands/build/build";
import deploy from "./commands/deploy";
import dev from "./commands/dev";

import { Config } from "./commands/deploy";

export { build, dev, deploy };
export type { Config };
