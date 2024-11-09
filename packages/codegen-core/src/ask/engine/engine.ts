import Ajv from "ajv";
import { JSONSchema7 } from "json-schema";
import { ExtendedJSONSchema7Object } from "./types";

export abstract class QuestionEngine {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      strictTypes: false,
      allErrors: true,
      useDefaults: true,
    });
  }

  /**
   * Show the initial message to the user
   * @param content
   */
  abstract start(content: string): Promise<void>;

  /**
   * Render questions based on the provided schema and the key
   * @param schema - The JSON schema defining the question
   * @param key - The key of the question in the answers object
   */
  abstract renderQuestion(schema: JSONSchema7, key: string): Promise<any>;

  /**
   * Show the final message to the user
   * @param content
   */
  abstract end(content: string): Promise<void>;

  /**
   * Show an error message to the user
   * @param content
   */
  abstract error(content: string): Promise<void>;

  /**
   * Show/update a loading message to the user
   * @param content
   */
  abstract showLoading(content?: string): Promise<void>;

  /**
   * Hide the loading message
   * @param content
   * @param code
   */
  abstract hideLoading(content?: string, code?: number): Promise<void>;

  /**
   * Adapts the provided questions schema to gather user input
   * @param questions - The JSON schema defining the questions
   */
  async adapt(questions: JSONSchema7): Promise<Record<string, any>> {
    const answers: Record<string, any> = Object.create(null);

    // Process the main schema properties first
    await this.processSchemaNode(questions, answers, "");

    // Handle top-level if/then/else conditions after initial processing
    if (questions.if && questions.then) {
      const ifConditionMet = await this.evaluateConditions(
        questions.if as JSONSchema7,
        answers,
      );

      if (ifConditionMet && questions.then) {
        const thenSchema = questions.then as JSONSchema7;
        await this.processSchemaNode(thenSchema, answers, "");
      } else if (!ifConditionMet && questions.else) {
        const elseSchema = questions.else as JSONSchema7;
        await this.processSchemaNode(elseSchema, answers, "");
      }
    }

    // verify the answers against the schema
    const valid = this.ajv.validate(questions, answers);
    if (!valid) {
      await this.error(this.ajv.errorsText());
      throw new Error("Validation failed");
    }
    return answers;
  }

  private async processSchemaNode(
    schema: JSONSchema7,
    answers: Record<string, any>,
    parentPath = "",
  ): Promise<void> {
    if (!schema.properties && !schema.if) return;

    // First handle if/then/else conditions
    if (schema.if) {
      const ifConditionMet = await this.evaluateConditions(
        schema.if as JSONSchema7,
        answers,
      );

      // Process base properties first
      if (schema.properties) {
        await this.processPropertiesNode(schema, answers, parentPath);
      }

      // Then apply conditional properties
      if (ifConditionMet && schema.then) {
        await this.processPropertiesNode(
          schema.then as JSONSchema7,
          answers,
          parentPath,
        );
      } else if (!ifConditionMet && schema.else) {
        await this.processPropertiesNode(
          schema.else as JSONSchema7,
          answers,
          parentPath,
        );
      }
    } else {
      // If no conditions, just process properties
      await this.processPropertiesNode(schema, answers, parentPath);
    }
  }

  private async processPropertiesNode(
    schema: JSONSchema7,
    answers: Record<string, any>,
    parentPath = "",
  ): Promise<void> {
    if (!schema.properties) return;

    // Handle required fields first
    const requiredFields = schema.required || [];
    for (const key of requiredFields) {
      if (schema.properties[key]) {
        await this.processProperty(
          schema.properties[key] as JSONSchema7,
          key,
          answers,
          parentPath,
        );
      }
    }

    // Handle optional fields
    for (const [key, property] of Object.entries(schema.properties)) {
      if (requiredFields.includes(key)) continue;
      await this.processProperty(
        property as JSONSchema7,
        key,
        answers,
        parentPath,
      );
    }
  }

  private async processProperty(
    propertySchema: JSONSchema7,
    key: string,
    answers: Record<string, any>,
    parentPath: string,
  ): Promise<void> {
    if (propertySchema.type === "object") {
      // Initialize the object if it doesn't exist
      if (!answers[key]) {
        answers[key] = Object.create(null);
      }

      // First process the base properties
      if (propertySchema.properties) {
        for (const [propKey, propSchema] of Object.entries(
          propertySchema.properties,
        )) {
          const fullPath = parentPath
            ? `${parentPath}.${key}.${propKey}`
            : `${key}.${propKey}`;
          const value = await this.renderQuestion(
            propSchema as JSONSchema7,
            fullPath,
          );
          if (value !== undefined && !['__proto__', 'constructor', 'prototype'].includes(propKey)) {
            if (!['__proto__', 'constructor', 'prototype'].includes(propKey)) {
              answers[key][propKey] = value;
            }
            // Update nested answers after each value is set
            this.setNestedValue(answers, fullPath, value);
          }
        }
      }

      // Then handle if/then/else conditions
      if (propertySchema.if) {
        const ifConditionMet = await this.evaluateConditions(
          propertySchema.if as JSONSchema7,
          answers[key],
        );

        let conditionalSchema: JSONSchema7 | undefined;
        if (ifConditionMet && propertySchema.then) {
          conditionalSchema = propertySchema.then as JSONSchema7;
        } else if (!ifConditionMet && propertySchema.else) {
          conditionalSchema = propertySchema.else as JSONSchema7;
        }

        // Process additional properties from then/else block
        if (conditionalSchema?.properties) {
          for (const [propKey, propSchema] of Object.entries(
            conditionalSchema.properties,
          )) {
            const fullPath = parentPath
              ? `${parentPath}.${key}.${propKey}`
              : `${key}.${propKey}`;
            const value = await this.renderQuestion(
              propSchema as JSONSchema7,
              fullPath,
            );
            if (value !== undefined && !['__proto__', 'constructor', 'prototype'].includes(propKey)) {
              if (!['__proto__', 'constructor', 'prototype'].includes(propKey)) {
                answers[key][propKey] = value;
              }
              this.setNestedValue(answers, fullPath, value);
            }
          }
        }
      }
    } else {
      // Handle non-object properties
      const value = await this.handlePropertyWithConditions(
        propertySchema,
        parentPath ? `${parentPath}.${key}` : key,
        answers,
      );
      if (value !== undefined) {
        this.setNestedValue(answers, key, value);
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
      if (part === "__proto__" || part === "constructor") {
        return;
      }
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Render a question based on the provided schema and its value if the schema defines a conditional property.
   *
   * @param schema JSON schema for the question
   * @param key Key of the question in the answers object
   * @param currentAnswers Current answers object
   * @protected
   */
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

    // Handle array types
    if (schema.type === "array" && schema.items) {
      const itemSchema = schema.items as JSONSchema7;

      // For primitive types (string, number, boolean), render the question directly
      if (["string", "number", "boolean"].includes(itemSchema.type as string)) {
        return this.renderQuestion(schema, key);
      }

      // For object types, process each item's properties
      if (itemSchema.type === "object" && itemSchema.properties) {
        const minItems = schema.minItems || 0;
        const result = [];

        // Get value for first item
        const renderedValue = await this.renderQuestion(schema, key);

        for (let i = 0; i < minItems; i++) {
          const itemAnswers: Record<string, any> = {};

          // For the first item, use the rendered value for the first property
          if (i === 0 && renderedValue !== undefined) {
            // Find the first property in the item schema
            const firstPropKey = Object.keys(itemSchema.properties)[0];
            if (firstPropKey) {
              itemAnswers[firstPropKey] = renderedValue;
            }
          }

          // Process remaining properties if any
          for (const [propKey, propSchema] of Object.entries(
            itemSchema.properties,
          )) {
            if (!(propKey in itemAnswers)) {
              // Skip if we already set this property
              const propValue = await this.renderQuestion(
                propSchema as JSONSchema7,
                `${key}[${i}].${propKey}`,
              );
              if (propValue !== undefined) {
                itemAnswers[propKey] = propValue;
              }
            }
          }
          result.push(itemAnswers);
        }

        return result;
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

  /**
   * Check if the provided conditions are met based on the answers object
   * @param schema
   * @param answers
   * @protected
   */
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
      return this.ajv.validate(schema, answers) as boolean;
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

  /**
   * Check if the provided field is required in the schema
   * @param schema JSON schema
   * @param field Field name
   * @protected
   */
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
