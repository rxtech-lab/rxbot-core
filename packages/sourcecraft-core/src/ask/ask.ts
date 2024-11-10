import * as fs from "node:fs/promises";
import { JSONSchema7 } from "json-schema";
import * as YAML from "yaml";
import { QuestionEngine } from "./engine";
import { isValidJsonSchema } from "./utils";

export interface Config {
  questions: JSONSchema7;
  engine: QuestionEngine;
}

/**
 * Ask ts is the helper function to ask questions to the user and get the answers in an object
 * @param config Configuration object containing Zod schema and questions
 * @returns Parsed and validated answers object
 */
export async function ask(config: Config): Promise<Record<string, any>> {
  // check if questions are valid
  const engine = config.engine;
  const isValid = isValidJsonSchema(config.questions);
  if (!isValid.isValid) {
    await engine.error(`Invalid JSON schema: ${isValid.error}`);
    throw new Error(`Invalid JSON schema: ${isValid.error}`);
  }
  return await engine.adapt(config.questions);
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
