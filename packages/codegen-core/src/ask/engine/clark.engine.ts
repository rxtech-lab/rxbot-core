import * as g from "@clack/prompts";
import { QuestionEngine } from "./engine";
import {
  ConfirmQuestion,
  InputQuestion,
  MultiChoiceQuestion,
  Question,
  SingleChoiceQuestion,
} from "./types";

export class ClarkEngine implements QuestionEngine {
  private spinner: any;
  async adapt<T extends Question<any>[]>(
    questions: [...T],
  ): Promise<Record<string, any>> {
    const adaptedQuestions: Record<string, any> = {};
    for (const question of questions) {
      switch (question.type) {
        case "input":
          adaptedQuestions[question.name] = await this.adaptText(question);
          break;
        case "singleChoice":
          adaptedQuestions[question.name] =
            await this.adaptSingleSelect(question);
          break;
        case "multiChoice":
          adaptedQuestions[question.name] =
            await this.adaptMultiSelect(question);
          break;
        case "confirm":
          adaptedQuestions[question.name] = await this.adaptConfirm(question);
          break;
      }
    }
    const grouped = await g.group(adaptedQuestions);
    for (const key in grouped) {
      if (g.isCancel(grouped[key])) {
        g.cancel("User cancelled the operation");
        throw new Error("User cancelled the operation");
      }
    }
    return grouped;
  }

  async adaptText(question: InputQuestion<any>) {
    return g.text({
      message: question.message,
      placeholder: question.placeholder,
      validate: (value) => {
        const result = question.validate?.(value);
        if (result) return result;
      },
    });
  }

  async adaptSingleSelect(question: SingleChoiceQuestion<any>) {
    return g.select({
      message: question.message,
      options: question.choices.map((choice) => ({
        value: choice.value,
        label: choice.label,
        hint: choice.hint,
      })),
    });
  }

  async adaptMultiSelect(question: MultiChoiceQuestion<any>) {
    return g.multiselect({
      message: question.message,
      options: question.choices.map((choice) => ({
        value: choice.value,
        label: choice.label,
        hint: choice.hint,
      })),
      required: (question.minChoices ?? 0) > 0,
    });
  }

  async adaptConfirm(question: ConfirmQuestion<any>) {
    return g.confirm({
      message: question.message,
      initialValue: question.default,
    });
  }

  async start(content: string): Promise<void> {
    g.intro(content);
  }

  async end(content: string): Promise<void> {
    g.outro(content);
  }

  async error(content: string): Promise<void> {
    g.cancel(content);
  }

  async showLoading(content?: string): Promise<void> {
    if (!this.spinner) {
      this.spinner = g.spinner();
    }
    this.spinner.start(content);
  }

  async hideLoading(content?: string, code?: number): Promise<void> {
    this.spinner.stop(content, code);
  }
}
