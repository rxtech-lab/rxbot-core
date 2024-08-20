import * as fs from "fs";
import * as path from "path";
import { generateApi } from "swagger-typescript-api";
import * as YAML from "yaml";

const spec = YAML.parse(
  fs.readFileSync(path.resolve(process.cwd(), "./spec.yaml"), "utf8"),
);

generateApi({
  name: "client.ts",
  output: path.resolve(process.cwd(), "./src/"),
  spec: spec,
  httpClientType: "fetch",
  extractEnums: true,
}).then(() => {
  process.exit(0);
});
