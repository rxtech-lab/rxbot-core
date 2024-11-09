import { Config, ask } from "./ask";

describe("ask", () => {
  it("should throw an error if validation fails", () => {
    const mockEngine = {
      adapt: jest.fn().mockRejectedValue(new Error("Validation failed")),
      error: jest.fn(),
    } as any;
    const questions: Config = {
      engine: mockEngine,
      questions: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 3,
          },
          age: {
            type: "number",
            minimum: 18,
          },
        },
      },
    };
    expect(() => ask(questions)).rejects.toThrow("Validation failed");
  });

  it("should return the answers if validation passes", async () => {
    const mockEngine = {
      adapt: jest.fn().mockResolvedValue({
        name: "John Doe",
        age: 25,
      }),
      error: jest.fn(),
    } as any;
    const questions: Config = {
      engine: mockEngine,
      questions: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 3,
          },
          age: {
            type: "number",
            minimum: 18,
          },
        },
      },
    };
    const answers = await ask(questions);
    expect(answers).toEqual({
      name: "John Doe",
      age: 25,
    });
  });
});
