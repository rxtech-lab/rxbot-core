import { z } from "zod";
import { InferQuestion } from "./engine/types";

export interface QuestionConfig<T extends z.ZodType> {
  schema: T;
  questions: Array<InferQuestion<z.infer<T>>>;
}
