import { ComponentBuilder } from "./componentBuilder";
import { ReactInstanceType } from "@rx-bot/common";
import { Button } from "../components";
import {
  DuplicatedKeyPropsError,
  MissingRequiredKeyPropsError,
  UnsupportedReactComponentError,
} from "@rx-bot/errors";

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
    ).toThrow(UnsupportedReactComponentError);
  });

  it("should throw error if instance type define the onClick props but not provide the required key props", () => {
    const builder = new ComponentBuilder();
    expect(() =>
      builder.build(
        ReactInstanceType.Button,
        { onClick: () => {} },
        { children: [] },
        {},
      ),
    ).toThrow(MissingRequiredKeyPropsError);
  });

  it("should not throw error if instance type define the onClick props and provide the required key props", () => {
    const builder = new ComponentBuilder();
    expect(() =>
      builder.build(
        ReactInstanceType.Button,
        { onClick: () => {}, key: "key" },
        { children: [] },
        {},
      ),
    ).not.toThrow();
  });

  it("should throw error if key is duplicated", () => {
    const builder = new ComponentBuilder();
    expect(() =>
      builder.build(
        ReactInstanceType.Button,
        { onClick: () => {}, key: "key" },
        { children: [] },
        {},
      ),
    ).not.toThrow();

    expect(() =>
      builder.build(
        ReactInstanceType.Button,
        { onClick: () => {}, key: "key" },
        { children: [] },
        {},
      ),
    ).toThrow(DuplicatedKeyPropsError);
  });
});
