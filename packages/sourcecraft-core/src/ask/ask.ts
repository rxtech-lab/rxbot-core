import * as fs from "node:fs/promises";
import { JSONSchema7 } from "json-schema";
import * as YAML from "yaml";
import { QuestionEngine } from "./engine";
import { isValidJsonSchema } from "./utils";

export interface Config {
  questions: JSONSchema7;
  engine: new () => QuestionEngine;
}

/**
 * Ask ts is the helper function to ask questions to the user and get the answers in an object
 * @param config Configuration object containing Zod schema and questions
 * @returns Parsed and validated answers object
 */
export async function ask(config: Config): Promise<Record<string, any>> {
  const engine = new config.engine();
  if (config.questions.title)
    await engine.start(`Starting ${config.questions.title}`);
  const answers = await engine.adapt(config.questions);
  if (engine.end && config.questions.title)
    await engine.end(config.questions.title);

  return answers;
}

interface Options {
  fs?: typeof fs;
}

/**
 * Ask from file is a helper function to ask questions from a file
 * @param filename
 * @param opts
 */
export async function askFromFile(
  filename: string,
  opts?: Options,
): Promise<Record<string, any>> {
  const fsModule = opts?.fs ?? fs;
  const file = await fsModule.readFile(filename, "utf-8");
  const config = YAML.parse(file) as Config;
  const isValid = isValidJsonSchema(config.questions);
  if (!isValid.isValid) {
    throw new Error(`Invalid JSON schema: ${isValid.error}`);
  }
  return ask(config);
}
