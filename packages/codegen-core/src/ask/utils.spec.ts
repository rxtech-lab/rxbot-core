import { isValidJsonSchema } from "./utils";

describe("utils", () => {
  describe("isValidJsonSchema", () => {
    it("should validate a valid JSON schema", () => {
      const schema = {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      };

      const result = isValidJsonSchema(schema);
      expect(result.isValid).toBe(true);
    });

    it("should return an error for an invalid JSON schema", () => {
      const schema = {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: "name",
      };

      const result = isValidJsonSchema(schema);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("data/required must be array");
    });

    it("should return an error for an invalid JSON schema", () => {
      const schema = {};
      const result = isValidJsonSchema(schema);
      expect(result.isValid).toBe(true);
    });
  });
});
