import { JSONSchema7 } from "json-schema";
import { QuestionEngine } from "./engine";

describe("engine", () => {
  const renderQuestion = jest.fn();
  class SimpleEngine extends QuestionEngine {
    end(content: string): Promise<void> {
      return Promise.resolve(undefined);
    }

    error(content: string): Promise<void> {
      return Promise.resolve(undefined);
    }

    hideLoading(content?: string, code?: number): Promise<void> {
      return Promise.resolve(undefined);
    }

    renderQuestion(schema: JSONSchema7, key: string): Promise<any> {
      return renderQuestion(schema, key);
    }

    showLoading(content?: string): Promise<void> {
      return Promise.resolve(undefined);
    }

    start(content: string): Promise<void> {
      return Promise.resolve(undefined);
    }

    isFieldRequired(schema: JSONSchema7, field: string): boolean {
      return super.isFieldRequired(schema, field);
    }
  }
  let engine: SimpleEngine;

  beforeEach(() => {
    engine = new SimpleEngine();
    renderQuestion.mockClear();
  });

  describe("isFieldRequired", () => {
    it("should return true if the field is required", () => {
      const schema: JSONSchema7 = {
        required: ["name"],
        properties: {
          name: {
            type: "string",
          },
        },
      };
      expect(engine.isFieldRequired(schema, "name")).toBe(true);
    });

    it("should return false if the field is not required", () => {
      const schema: JSONSchema7 = {
        properties: {
          name: {
            type: "string",
          },
        },
      };
      expect(engine.isFieldRequired(schema, "name")).toBe(false);
    });
  });

  describe("adapt", () => {
    it("should adapt schema correctly", async () => {
      renderQuestion.mockResolvedValueOnce("foo");
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          },
        },
      };
      expect(await engine.adapt(schema)).toStrictEqual({
        foo: "foo",
      });
    });

    it("should render empty object if schema is empty", async () => {
      const schema: JSONSchema7 = {};
      expect(await engine.adapt(schema)).toStrictEqual({});
    });

    it("should render nested object correctly", async () => {
      renderQuestion.mockResolvedValueOnce("foo").mockResolvedValueOnce("baz");
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: {
                type: "string",
              },
            },
          },
          something: {
            type: "string",
          },
        },
      };
      expect(await engine.adapt(schema)).toStrictEqual({
        foo: {
          bar: "foo",
        },
        something: "baz",
      });
    });

    it("should render array correctly", async () => {
      renderQuestion.mockResolvedValueOnce(["foo", "bar"]);
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          foo: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      };
      expect(await engine.adapt(schema)).toStrictEqual({
        foo: ["foo", "bar"],
      });
    });

    it("should adapt schema correctly with conditions", async () => {
      renderQuestion.mockResolvedValueOnce("bar").mockResolvedValueOnce("foo");
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          },
        },
        if: {
          properties: {
            foo: {
              const: "bar",
            },
          },
        },
        then: {
          properties: {
            bar: {
              type: "string",
            },
          },
        },
      };
      expect(await engine.adapt(schema)).toStrictEqual({
        foo: "bar",
        bar: "foo",
      });
    });
  });
});
