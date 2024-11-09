import { JSONSchema7 } from "json-schema";
import { undefined } from "zod";
import { QuestionEngine } from "./engine";

describe("engine", () => {
  const renderQuestion = jest.fn();
  class SimpleEngine extends QuestionEngine {
    async end(content: string): Promise<void> {}

    async error(content: string): Promise<void> {}

    async hideLoading(content?: string, code?: number): Promise<void> {}

    async renderQuestion(schema: JSONSchema7, key: string): Promise<any> {
      return renderQuestion(schema, key);
    }

    async showLoading(content?: string): Promise<void> {}

    async start(content: string): Promise<void> {}

    isFieldRequired(schema: JSONSchema7, field: string): boolean {
      return super.isFieldRequired(schema, field);
    }

    async warn(content: string): Promise<void> {}
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
    describe("rendering without conditions", () => {
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
        expect(await engine.adapt(schema)).toEqual({
          foo: "foo",
        });
      });

      it("should render empty object if schema is empty", async () => {
        const schema: JSONSchema7 = {};
        expect(await engine.adapt(schema)).toEqual({});
      });

      it("should render nested object correctly", async () => {
        renderQuestion
          .mockResolvedValueOnce("foo")
          .mockResolvedValueOnce("baz");
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
        expect(await engine.adapt(schema)).toEqual({
          foo: {
            bar: "foo",
          },
          something: "baz",
        });
      });

      it("should render array correctly", async () => {
        renderQuestion.mockResolvedValueOnce(["foo"]);
        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            foo: {
              type: "array",
              minItems: 1,
              items: {
                minItems: 1,
                type: "string",
              },
            },
          },
        };
        expect(await engine.adapt(schema)).toEqual({
          foo: ["foo"],
        });
      });

      it("should render array of objects correctly", async () => {
        renderQuestion.mockResolvedValueOnce("foo");
        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            foo: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  bar: {
                    type: "string",
                  },
                },
              },
            },
          },
        };
        expect(await engine.adapt(schema)).toEqual({
          foo: [
            {
              bar: "foo",
            },
          ],
        });
      });
    });

    describe("rendering with conditions", () => {
      it("should adapt schema correctly with conditions", async () => {
        renderQuestion
          .mockResolvedValueOnce("bar")
          .mockResolvedValueOnce("foo");
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
        expect(await engine.adapt(schema)).toEqual({
          foo: "bar",
          bar: "foo",
        });
      });

      it("should render nested object with if/then condition on nested property", async () => {
        renderQuestion
          .mockResolvedValueOnce("special") // value for foo.type
          .mockResolvedValueOnce("test"); // value for foo.extra

        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            foo: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                },
              },
              if: {
                properties: {
                  type: { const: "special" },
                },
              },
              then: {
                properties: {
                  extra: {
                    type: "string",
                  },
                },
              },
            },
          },
        };

        expect(await engine.adapt(schema)).toEqual({
          foo: {
            type: "special",
            extra: "test",
          },
        });
      });

      it("should not render conditional properties when condition is not met", async () => {
        renderQuestion.mockResolvedValueOnce("normal"); // value for foo.type

        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            foo: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                },
              },
              if: {
                properties: {
                  type: { const: "special" },
                },
              },
              then: {
                properties: {
                  extra: {
                    type: "string",
                  },
                },
              },
            },
          },
        };

        expect(await engine.adapt(schema)).toEqual({
          foo: {
            type: "normal",
          },
        });
      });

      it("should handle multiple levels of nested objects with conditions", async () => {
        renderQuestion
          .mockResolvedValueOnce("config") // value for type
          .mockResolvedValueOnce("db") // value for config.type
          .mockResolvedValueOnce("mysql"); // value for config.database

        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            type: {
              type: "string",
            },
          },
          if: {
            properties: {
              type: { const: "config" },
            },
          },
          then: {
            properties: {
              config: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                  },
                },
                if: {
                  properties: {
                    type: { const: "db" },
                  },
                },
                then: {
                  properties: {
                    database: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        };

        expect(await engine.adapt(schema)).toEqual({
          type: "config",
          config: {
            type: "db",
            database: "mysql",
          },
        });
      });

      it("should handle if/then/else in nested objects", async () => {
        renderQuestion
          .mockResolvedValueOnce("other") // value for foo.type
          .mockResolvedValueOnce("fallback"); // value for foo.fallback

        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            foo: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                },
              },
              if: {
                properties: {
                  type: { const: "special" },
                },
              },
              then: {
                properties: {
                  extra: {
                    type: "string",
                  },
                },
              },
              else: {
                properties: {
                  fallback: {
                    type: "string",
                  },
                },
              },
            },
          },
        };

        expect(await engine.adapt(schema)).toEqual({
          foo: {
            type: "other",
            fallback: "fallback",
          },
        });
      });

      it("should handle conditions with nested array objects", async () => {
        renderQuestion
          .mockResolvedValueOnce("advanced") // value for mode
          .mockResolvedValueOnce(["item1"]); // value for items array

        const schema: JSONSchema7 = {
          type: "object",
          properties: {
            mode: {
              type: "string",
            },
          },
          if: {
            properties: {
              mode: { const: "advanced" },
            },
          },
          then: {
            properties: {
              items: {
                type: "array",
                items: {
                  type: "string",
                },
                minItems: 1,
              },
            },
          },
        };

        expect(await engine.adapt(schema)).toEqual({
          mode: "advanced",
          items: ["item1"],
        });
      });
    });
  });
});
