import { ContainerType, ReactInstanceType } from "@rx-lab/common";
import {
  DuplicatedKeyPropsError,
  MissingRequiredKeyPropsError,
  UnsupportedReactComponentError,
} from "@rx-lab/errors";
import { Button } from "../index";
import { ComponentBuilder } from "./componentBuilder";

describe("should be able to build component", () => {
  it("should be able to build button component", () => {
    const builder = new ComponentBuilder();
    const result = builder.build(
      ReactInstanceType.Button,
      {},
      {
        chatroomInfo: undefined,
        message: undefined,
        children: [],
        type: ContainerType.ROOT,
        hasBeenMentioned: false,
        isInGroup: false,
        attachments: [],
      },
      {},
    );
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Button);
  });

  it("should be able to build multiple button components", () => {
    const builder = new ComponentBuilder();
    const result = builder.build(
      ReactInstanceType.Button,
      {},
      {
        chatroomInfo: undefined,
        message: undefined,
        children: [],
        type: ContainerType.ROOT,
        hasBeenMentioned: false,
        isInGroup: false,
        attachments: [],
      },
      {},
    );
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Button);

    const result2 = builder.build(
      ReactInstanceType.Button,
      {},
      {
        chatroomInfo: undefined,
        message: undefined,
        children: [],
        type: ContainerType.ROOT,
        hasBeenMentioned: false,
        isInGroup: false,
        attachments: [],
      },
      {},
    );
    expect(result2).toBeDefined();
    expect(result2).toBeInstanceOf(Button);
  });

  it("should throw error when building unsupported component", () => {
    const builder = new ComponentBuilder();
    expect(() =>
      builder.build(
        "UnsupportedComponent" as ReactInstanceType,
        {},
        {
          chatroomInfo: undefined,
          message: undefined,
          children: [],
          type: ContainerType.ROOT,
          hasBeenMentioned: false,
          isInGroup: false,
          attachments: [],
        },
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
        {
          chatroomInfo: undefined,
          message: undefined,
          children: [],
          type: ContainerType.ROOT,
          hasBeenMentioned: false,
          isInGroup: false,
          attachments: [],
        },
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
        {
          chatroomInfo: undefined,
          message: undefined,
          children: [],
          type: ContainerType.ROOT,
          hasBeenMentioned: false,
          isInGroup: false,
          attachments: [],
        },
        {},
      ),
    ).not.toThrow();
  });

  //TODO: Disable this test. Should check using compiler in the future
  it.skip("should throw error if key is duplicated", () => {
    const builder = new ComponentBuilder();
    expect(() =>
      builder.build(
        ReactInstanceType.Button,
        { onClick: () => {}, key: "key" },
        {
          chatroomInfo: undefined,
          message: undefined,
          children: [],
          type: ContainerType.ROOT,
          hasBeenMentioned: false,
          isInGroup: false,
          attachments: [],
        },
        {},
      ),
    ).not.toThrow();

    expect(() =>
      builder.build(
        ReactInstanceType.Button,
        { onClick: () => {}, key: "key" },
        {
          chatroomInfo: undefined,
          message: undefined,
          children: [],
          type: ContainerType.ROOT,
          hasBeenMentioned: false,
          isInGroup: false,
          attachments: [],
        },
        {},
      ),
    ).toThrow(DuplicatedKeyPropsError);
  });
});
