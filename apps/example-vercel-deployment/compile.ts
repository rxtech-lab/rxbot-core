import * as path from "path";
import { Compiler } from "@rx-lab/core";

(async () => {
  const compiler = new Compiler({
    rootDir: path.join(__dirname, "src"),
    destinationDir: path.join(__dirname, ".rx-lab"),
  });
  await compiler.compile();
})();
