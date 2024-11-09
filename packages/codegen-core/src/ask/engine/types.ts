export type SupportedQuestionTypes =
  | "input"
  | "singleChoice"
  | "multiChoice"
  | "confirm";

interface BaseQuestion<K> {
  type: SupportedQuestionTypes;
  name: K;
  message: string;
  placeholder?: string;
}

interface Choice {
  value: string;
  label: string;
  hint?: string;
}

export interface InputQuestion<K> extends BaseQuestion<K> {
  type: "input";
  validate?: (input: string) => string | undefined;
}

export interface SingleChoiceQuestion<K> extends BaseQuestion<K> {
  type: "singleChoice";
  choices: Choice[];
}

export interface MultiChoiceQuestion<K> extends BaseQuestion<K> {
  type: "multiChoice";
  choices: Choice[];
  minChoices?: number;
  maxChoices?: number;
}

export interface ConfirmQuestion<K> extends BaseQuestion<K> {
  type: "confirm";
  default?: boolean;
}

export type Question<K> =
  | InputQuestion<K>
  | SingleChoiceQuestion<K>
  | MultiChoiceQuestion<K>
  | ConfirmQuestion<K>;

export type InferQuestion<T> = {
  [K in keyof T]: Question<K> & { name: K };
}[keyof T];
