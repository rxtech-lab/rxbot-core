import { z } from "zod";
import { Config, ask } from "./ask";

describe("ask", () => {
  it("should throw an error if validation fails", () => {
    const userSchema = z.object({
      name: z.string().min(2),
      age: z.number().int(),
    });

    const mockEngine = jest.fn().mockImplementation(() => ({
      adapt: jest.fn().mockResolvedValue({}),
      error: jest.fn(),
    }));
    const questions: Config<typeof userSchema> = {
      schema: userSchema,
      engine: mockEngine,
      questions: [
        {
          name: "age",
          message: "What is your name?",
          type: "input",
        },
      ],
    };
    expect(() => ask(questions)).rejects.toThrow("Validation failed");
  });

  it("should return the answers if validation passes", async () => {
    const userSchema = z.object({
      name: z.string().min(2),
      age: z.number().int(),
    });

    const mockEngine = jest.fn().mockImplementation(() => ({
      adapt: jest.fn().mockResolvedValue({
        name: "John Doe",
        age: 25,
      }),
      error: jest.fn(),
    }));
    const questions: Config<typeof userSchema> = {
      schema: userSchema,
      engine: mockEngine,
      questions: [
        {
          name: "name",
          message: "What is your name?",
          type: "input",
        },
        {
          name: "age",
          message: "What is your age?",
          type: "input",
        },
      ],
    };
    const answers = await ask(questions);
    expect(answers).toEqual({
      name: "John Doe",
      age: 25,
    });
  });
});
