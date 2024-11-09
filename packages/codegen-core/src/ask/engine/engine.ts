import Ajv from "ajv";
import { JSONSchema7 } from "json-schema";
import { ExtendedJSONSchema7Object } from "./types";

export abstract class QuestionEngine {
  private currentAnswers: Record<string, any> = {};
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      strictTypes: false,
      allErrors: true,
      useDefaults: true,
    });
  }

  abstract start(content: string): Promise<void>;
  abstract renderQuestion(schema: JSONSchema7, key: string): Promise<any>;
  abstract end(content: string): Promise<void>;
  abstract error(content: string): Promise<void>;
  abstract showLoading(content?: string): Promise<void>;
  abstract hideLoading(content?: string, code?: number): Promise<void>;

  async adapt(questions: JSONSchema7): Promise<Record<string, any>> {
    const answers: Record<string, any> = {};

    // Process the main schema properties first
    await this.processSchemaNode(questions, answers);

    // Handle top-level if/then/else conditions after initial processing
    if (questions.if && questions.then) {
      const ifConditionMet = await this.evaluateConditions(
        questions.if as JSONSchema7,
        answers,
      );

      if (ifConditionMet && questions.then) {
        const thenSchema = questions.then as JSONSchema7;
        await this.processSchemaNode(thenSchema, answers);
      } else if (!ifConditionMet && questions.else) {
        const elseSchema = questions.else as JSONSchema7;
        await this.processSchemaNode(elseSchema, answers);
      }
    }

    return answers;
  }

  private async processSchemaNode(
    schema: JSONSchema7,
    answers: Record<string, any>,
    parentPath = "",
  ): Promise<void> {
    if (!schema.properties) return;

    // Handle required fields first
    const requiredFields = schema.required || [];
    for (const key of requiredFields) {
      if (schema.properties[key]) {
        const property = schema.properties[key] as JSONSchema7;
        const value = await this.handlePropertyWithConditions(
          property,
          key,
          this.currentAnswers,
        );
        this.setNestedValue(answers, key, value);
        this.currentAnswers = {
          ...this.currentAnswers,
          ...this.flattenObject(answers),
        };
      }
    }

    // Handle optional fields and conditional logic
    for (const [key, property] of Object.entries(schema.properties)) {
      if (requiredFields.includes(key)) continue;

      const propertySchema = property as JSONSchema7;
      const shouldShow = await this.evaluateConditions(
        propertySchema,
        this.currentAnswers,
      );

      if (shouldShow) {
        if (propertySchema.type === "object" && propertySchema.properties) {
          // Handle nested objects
          const nestedAnswers = {};
          await this.processSchemaNode(propertySchema, nestedAnswers);
          if (Object.keys(nestedAnswers).length > 0) {
            this.setNestedValue(answers, key, nestedAnswers);
            this.currentAnswers = {
              ...this.currentAnswers,
              ...this.flattenObject(answers),
            };
          }
        } else {
          const value = await this.handlePropertyWithConditions(
            propertySchema,
            key,
            this.currentAnswers,
          );
          if (value !== undefined) {
            this.setNestedValue(answers, key, value);
            this.currentAnswers = {
              ...this.currentAnswers,
              ...this.flattenObject(answers),
            };
          }
        }
      }
    }
  }

  private setNestedValue(
    obj: Record<string, any>,
    path: string,
    value: any,
  ): void {
    const parts = path.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  private flattenObject(
    obj: Record<string, any>,
    prefix = "",
  ): Record<string, any> {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const pre = prefix.length ? `${prefix}.${key}` : key;
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          Object.assign(acc, this.flattenObject(obj[key], pre));
        } else {
          acc[pre] = obj[key];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  protected async handlePropertyWithConditions(
    schema: JSONSchema7,
    key: string,
    currentAnswers: Record<string, any>,
  ): Promise<any> {
    // Handle if/then/else conditions
    if (schema.if && schema.then) {
      const ifConditionMet = await this.evaluateConditions(
        schema.if as JSONSchema7,
        currentAnswers,
      );

      if (ifConditionMet && schema.then) {
        const value = await this.renderQuestion(
          this.mergeSchemas(schema, schema.then as JSONSchema7),
          key,
        );
        return value;
      }

      if (!ifConditionMet && schema.else) {
        const value = await this.renderQuestion(
          this.mergeSchemas(schema, schema.else as JSONSchema7),
          key,
        );
        return value;
      }
    }

    // If the schema is an object type with properties, handle it specially
    if (schema.type === "object" && schema.properties) {
      const nestedAnswers = {};
      await this.processSchemaNode(schema, nestedAnswers);
      return nestedAnswers;
    }

    return this.renderQuestion(schema, key);
  }

  protected async evaluateConditions(
    schema: JSONSchema7,
    answers: Record<string, any>,
  ): Promise<boolean> {
    try {
      // Handle dependencies
      if (schema.dependencies) {
        for (const [prop, dependency] of Object.entries(schema.dependencies)) {
          if (answers[prop]) {
            if (Array.isArray(dependency)) {
              // Property dependencies
              const missingDeps = dependency.filter((dep) => !answers[dep]);
              if (missingDeps.length > 0) return false;
            } else {
              // Schema dependencies
              if (!this.ajv.validate(dependency as JSONSchema7, answers))
                return false;
            }
          }
        }
      }

      // Handle conditional schemas
      if (
        schema.if ||
        schema.allOf ||
        schema.anyOf ||
        schema.oneOf ||
        schema.not
      ) {
        return this.ajv.validate(schema, answers) as boolean;
      }

      return true;
    } catch (error) {
      console.error("Schema validation error:", error);
      return true; // Default to showing the field if validation fails
    }
  }

  protected getOptionsFromOneOfField(schema: JSONSchema7) {
    if (schema.enum) {
      return schema.enum.map((value) => ({
        value,
        label: value?.toString(),
      }));
    }

    if (schema.oneOf) {
      return schema.oneOf.map((option) => {
        const enumOption = option as ExtendedJSONSchema7Object;
        return {
          value: enumOption.const,
          label: enumOption.title || enumOption.const?.toString(),
          hint: enumOption.description,
        };
      });
    }

    return [];
  }

  protected isFieldRequired(schema: JSONSchema7, field: string): boolean {
    return schema.required?.includes(field) || false;
  }

  private mergeSchemas(base: JSONSchema7, extension: JSONSchema7): JSONSchema7 {
    return {
      ...base,
      ...extension,
      properties: {
        ...(base.properties || {}),
        ...(extension.properties || {}),
      },
    };
  }
}
