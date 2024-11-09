import { z } from "zod";
import { QuestionEngine } from "./engine";
import { InferQuestion } from "./engine/types";

export interface Config<T extends z.ZodType> {
  schema: T;
  questions: Array<InferQuestion<z.infer<T>>>;
  engine: new () => QuestionEngine;
  startMessage?: string;
  endMessage?: string;
}

/**
 * Ask ts is the helper function to ask questions to the user and get the answers in an object
 * @param config Configuration object containing Zod schema and questions
 * @returns Parsed and validated answers object
 */
export async function ask<T extends z.ZodType>(
  config: Config<T>,
): Promise<z.infer<T>> {
  const engine = new config.engine();
  if (config.startMessage) await engine.start(config.startMessage);
  const answers = await engine.adapt(config.questions);
  // Validate answers against the schema
  const result = config.schema.safeParse(answers);

  if (!result.success) {
    await engine.error(result.error.errors.join("\n"));
    throw new Error("Validation failed");
  }
  if (engine.end && config.endMessage) await engine.end(config.endMessage);

  return result.data;
}
