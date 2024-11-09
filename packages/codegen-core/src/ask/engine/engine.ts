import { Question } from "./types";

export interface QuestionEngine {
  start(content: string): Promise<void>;
  /**
   * Adapt the questions to the engine's format and return answers
   * @param questions Array of questions
   */
  adapt<T extends Question<any>[]>(
    questions: [...T],
  ): Promise<Record<string, any>>;
  end(content: string): Promise<void>;
  error(content: string): Promise<void>;
  showLoading(content?: string): Promise<void>;
  hideLoading(content?: string, code?: number): Promise<void>;
}
