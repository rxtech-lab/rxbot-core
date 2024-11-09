import * as g from "@clack/prompts";
import { JSONSchema7 } from "json-schema";
import { QuestionEngine } from "./engine";

export class ClarkEngine extends QuestionEngine {
  private spinner: any;

  async renderQuestion(schema: JSONSchema7, key: string): Promise<any> {
    const message = schema.title || key;

    // Handle array type as multiChoice
    if (
      schema.type === "array" &&
      schema.items &&
      typeof schema.items === "object" &&
      "enum" in schema.items
    ) {
      const options = this.getOptionsFromOneOfField(schema.items);
      return g.multiselect({
        message,
        options: options as any,
        required: this.isFieldRequired(schema, key),
      });
    }

    // Handle enum type as singleChoice
    if (schema.enum) {
      const options = this.getOptionsFromOneOfField(schema);
      return g.select({
        message,
        options: options as any,
        maxItems: schema.maxItems,
      });
    }

    // Handle boolean as confirm
    if (schema.type === "boolean") {
      return g.confirm({
        message,
        initialValue: schema.default as boolean,
      });
    }

    // Handle string/number as input
    if (schema.type === "string" || schema.type === "number") {
      return g.text({
        message,
        placeholder: schema.default?.toString(),
        validate: (value) => {
          if (schema.minLength && value.length < schema.minLength) {
            return `Minimum length is ${schema.minLength}`;
          }
          if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
              return `Value must match pattern: ${schema.pattern}`;
            }
          }
          if (schema.type === "number") {
            const num = Number(value);
            if (Number.isNaN(num)) {
              return "Please enter a valid number";
            }
            if (num < (schema.minimum ?? 0)) {
              return `Minimum value is ${schema.minimum}`;
            }
            if (num > (schema.maximum ?? 0)) {
              return `Maximum value is ${schema.maximum}`;
            }
          }
          return undefined;
        },
      });
    }

    return undefined;
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
