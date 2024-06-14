import { ComponentBuilder } from "./componentBuilder";
import { ReactInstanceType } from "@rx-bot/common";
import { Button } from "../components";
import { UnsupportedComponentError } from "@rx-bot/errors";

describe("should be able to build component", () => {
  it("should be able to build button component", () => {
    const builder = new ComponentBuilder();
    const result = builder.build(
      ReactInstanceType.Button,
      {},
      { children: [] },
      {},
    );
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Button);
  });

  it("should throw error when building unsupported component", () => {
    const builder = new ComponentBuilder();
    expect(() =>
      builder.build(
        "UnsupportedComponent" as ReactInstanceType,
        {},
        { children: [] },
        {},
      ),
    ).toThrow(UnsupportedComponentError);
  });
});
