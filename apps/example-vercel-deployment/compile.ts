import * as path from "path";
import { Compiler } from "@rx-lab/core";

(async () => {
  const compiler = new Compiler({
    rootDir: path.join(__dirname, "src"),
    destinationDir: ".rx-lab",
  });
  await compiler.compile();
})();
