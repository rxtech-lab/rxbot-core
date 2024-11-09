import Ajv from "ajv";
import type { JSONSchemaType } from "ajv";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates if the provided schema is a valid JSON Schema
 * @param schema - The schema to validate
 * @returns ValidationResult object containing validation status and any errors
 */
export function isValidJsonSchema(schema: unknown): ValidationResult {
  try {
    // Create new instance of AJV
    const ajv = new Ajv({
      allErrors: true, // Check all rules collecting all errors
      strict: true, // Enable strict mode for better error reporting
      validateSchema: true, // Validate the schema itself
    });

    // First validate that the input is an object
    if (typeof schema !== "object" || schema === null) {
      return {
        isValid: false,
        error: "Schema must be a valid JSON object",
      };
    }

    // Validate the schema itself
    const validateSchema = ajv.validateSchema(schema);

    if (!validateSchema) {
      return {
        isValid: false,
        error: ajv.errorsText(ajv.errors),
      };
    }

    // Try to compile the schema to catch any runtime errors
    try {
      ajv.compile(schema as unknown as JSONSchemaType<unknown>);
      return {
        isValid: true,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      };
    }
  } catch (error) {
    // Handle any unexpected errors
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
