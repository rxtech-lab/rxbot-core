import * as g from "@clack/prompts";
import { JSONSchema7 } from "json-schema";
import { ClarkEngine } from "./clark.engine";

jest.mock("@clack/prompts");

describe("ClarkEngine", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("renderQuestion", () => {
    describe("text", () => {
      it("should render text prompt", async () => {
        const schema: JSONSchema7 = {
          type: "string",
          title: "Name",
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "name");
        expect(g.text).toHaveBeenCalledWith({
          message: "Name",
          placeholder: undefined,
          validate: expect.any(Function),
        });
      });

      it("should render text prompt with placeholder", async () => {
        const schema: JSONSchema7 = {
          type: "string",
          title: "Name",
          default: "John Doe",
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "name");
        expect(g.text).toHaveBeenCalledWith({
          message: "Name",
          placeholder: "John Doe",
          validate: expect.any(Function),
        });
      });

      it("should render number prompt", async () => {
        const schema: JSONSchema7 = {
          type: "number",
          title: "Age",
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "age");
        expect(g.text).toHaveBeenCalledWith({
          message: "Age",
          placeholder: undefined,
          validate: expect.any(Function),
        });
      });

      it("should render number prompt with placeholder", async () => {
        const schema: JSONSchema7 = {
          type: "number",
          title: "Age",
          default: 25,
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "age");
        expect(g.text).toHaveBeenCalledWith({
          message: "Age",
          placeholder: "25",
          validate: expect.any(Function),
        });
      });

      it("should return number if input is a number", async () => {
        const schema: JSONSchema7 = {
          type: "number",
          title: "Age",
        };
        jest.spyOn(g, "text").mockResolvedValue("25");
        const engine = new ClarkEngine();
        const result = await engine.renderQuestion(schema, "age");
        expect(result).toBe(25);
      });
    });

    describe("confirm", () => {
      it("should render confirm prompt", async () => {
        const schema: JSONSchema7 = {
          type: "boolean",
          title: "Are you sure?",
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "confirm");
        expect(g.confirm).toHaveBeenCalledWith({
          message: "Are you sure?",
          initialValue: undefined,
        });
      });

      it("should render confirm prompt with default value", async () => {
        const schema: JSONSchema7 = {
          type: "boolean",
          title: "Are you sure?",
          default: true,
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "confirm");
        expect(g.confirm).toHaveBeenCalledWith({
          message: "Are you sure?",
          initialValue: true,
        });
      });

      it("should render confirm prompt with default value", async () => {
        const schema: JSONSchema7 = {
          type: "boolean",
          title: "Are you sure?",
          default: false,
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "confirm");
        expect(g.confirm).toHaveBeenCalledWith({
          message: "Are you sure?",
          initialValue: false,
        });
      });
    });

    describe("singleChoice", () => {
      describe("oneOf", () => {
        it("should render singleChoice prompt", async () => {
          const schema: JSONSchema7 = {
            type: "string",
            title: "Choose an option",
            oneOf: [
              { const: "a", title: "Option A" },
              { const: "b", title: "Option B" },
            ],
          };
          const engine = new ClarkEngine();
          await engine.renderQuestion(schema, "option");
          expect(g.select).toHaveBeenCalledWith({
            message: "Choose an option",
            maxItems: undefined,
            options: [
              { label: "Option A", value: "a", hint: undefined },
              { label: "Option B", value: "b", hint: undefined },
            ],
          });
        });

        it("should render singleChoice prompt with default", async () => {
          const schema: JSONSchema7 = {
            type: "string",
            title: "Choose an option",
            default: "b",
            oneOf: [
              { const: "a", title: "Option A" },
              { const: "b", title: "Option B" },
            ],
          };
          const engine = new ClarkEngine();
          await engine.renderQuestion(schema, "option");
          expect(g.select).toHaveBeenCalledWith({
            message: "Choose an option",
            maxItems: undefined,
            options: [
              {
                label: "Option A",
                value: "a",
                hint: undefined,
                default: false,
              },
              { label: "Option B", value: "b", hint: undefined, default: true },
            ],
          });
        });

        it("should render singleChoice prompt with hint", async () => {
          const schema: JSONSchema7 = {
            type: "string",
            title: "Choose an option",
            oneOf: [
              {
                const: "a",
                title: "Option A",
                description: "This is option A",
              },
              {
                const: "b",
                title: "Option B",
                description: "This is option B",
              },
            ],
          };
          const engine = new ClarkEngine();
          await engine.renderQuestion(schema, "option");
          expect(g.select).toHaveBeenCalledWith({
            message: "Choose an option",
            maxItems: undefined,
            options: [
              { label: "Option A", value: "a", hint: "This is option A" },
              { label: "Option B", value: "b", hint: "This is option B" },
            ],
          });
        });
      });
      describe("enum", () => {
        it("should render singleChoice prompt without default", async () => {
          const schema: JSONSchema7 = {
            type: "string",
            title: "Choose an option",
            enum: ["a", "b"],
          };
          const engine = new ClarkEngine();
          await engine.renderQuestion(schema, "option");
          expect(g.select).toHaveBeenCalledWith({
            message: "Choose an option",
            maxItems: undefined,
            options: [
              { label: "a", value: "a", default: undefined },
              { label: "b", value: "b", default: undefined },
            ],
          });
        });

        it("should render singleChoice prompt with default", async () => {
          const schema: JSONSchema7 = {
            type: "string",
            title: "Choose an option",
            default: "b",
            enum: ["a", "b"],
          };
          const engine = new ClarkEngine();
          await engine.renderQuestion(schema, "option");
          expect(g.select).toHaveBeenCalledWith({
            message: "Choose an option",
            maxItems: undefined,
            options: [
              { label: "a", value: "a", default: false },
              { label: "b", value: "b", default: true },
            ],
          });
        });
      });
    });

    describe("multipleChoice", () => {
      it("should render multipleChoice prompt", async () => {
        const schema: JSONSchema7 = {
          type: "array",
          title: "Choose an option",
          items: {
            type: "string",
            oneOf: [
              { const: "a", title: "Option A" },
              { const: "b", title: "Option B" },
            ],
          },
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "option");
        expect(g.multiselect).toHaveBeenCalledWith({
          message: "Choose an option",
          required: false,
          options: [
            { label: "Option A", value: "a", hint: undefined },
            { label: "Option B", value: "b", hint: undefined },
          ],
        });
      });

      it("should render multipleChoice prompt with hint", async () => {
        const schema: JSONSchema7 = {
          type: "array",
          title: "Choose an option",
          items: {
            type: "string",
            oneOf: [
              {
                const: "a",
                title: "Option A",
                description: "This is option A",
              },
              {
                const: "b",
                title: "Option B",
                description: "This is option B",
              },
            ],
          },
        };
        const engine = new ClarkEngine();
        await engine.renderQuestion(schema, "option");
        expect(g.multiselect).toHaveBeenCalledWith({
          message: "Choose an option",
          required: false,
          options: [
            { label: "Option A", value: "a", hint: "This is option A" },
            { label: "Option B", value: "b", hint: "This is option B" },
          ],
        });
      });

      it("should render multipleChoice prompt with min and max items", async () => {
        const schema: JSONSchema7 = {
          type: "array",
          title: "Choose an option",
          minItems: 1,
          maxItems: 2,
          items: {
            type: "string",
            oneOf: [
              {
                const: "a",
                title: "Option A",
                description: "This is option A",
              },
              {
                const: "b",
                title: "Option B",
                description: "This is option B",
              },
            ],
          },
        };
        const engine = new ClarkEngine();
        jest.spyOn(g, "multiselect").mockResolvedValue(["a"]);
        await engine.renderQuestion(schema, "option");
        expect(g.multiselect).toHaveBeenCalledWith({
          message: "Choose an option",
          required: true,
          options: [
            { label: "Option A", value: "a", hint: "This is option A" },
            { label: "Option B", value: "b", hint: "This is option B" },
          ],
        });
      });

      it("should render multipleChoice multiple times if max items exceed", async () => {
        const schema: JSONSchema7 = {
          type: "array",
          title: "Choose an option",
          minItems: 1,
          maxItems: 1,
          items: {
            type: "string",
            oneOf: [
              {
                const: "a",
                title: "Option A",
                description: "This is option A",
              },
              {
                const: "b",
                title: "Option B",
                description: "This is option B",
              },
            ],
          },
        };
        const engine = new ClarkEngine();
        jest
          .spyOn(g, "multiselect")
          .mockResolvedValueOnce(["a", "b"])
          .mockResolvedValueOnce(["a"]);
        await engine.renderQuestion(schema, "option");
        expect(g.multiselect).toHaveBeenCalledTimes(2);
      });
    });
  });
});
