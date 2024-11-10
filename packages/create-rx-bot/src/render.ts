import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ClarkEngine, ask, createNodeGenerator } from "sourcecraft-core/node";
import * as yaml from "yaml";

const DEFAULT_TEMPLATE_DIR = "templates";

export async function render() {
  const engine = new ClarkEngine();
  const cwd = __dirname;
  try {
    const schemaPath = path.join(
      __dirname,
      DEFAULT_TEMPLATE_DIR,
      "schema.yaml",
    );
    const schema = await fs.readFile(schemaPath, "utf-8");
    const parsedSchema = yaml.parse(schema);
    await engine.start(parsedSchema.title || "Create Rx Bot");
    const results = await ask({
      engine: engine,
      questions: parsedSchema,
    });
    const renderer = createNodeGenerator({
      questionEngine: engine,
      userValues: results,
      cwd: () => cwd,
    });
    await renderer.render();
    await engine.end(`Successfully created ${results.projectName}`);
  } catch (error) {
    await engine.error(`Error creating project: ${error}`);
    process.exit(1);
  }
}
