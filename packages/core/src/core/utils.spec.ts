import React from "react";
import { isPropsEqual } from "./utils";

interface InstanceProps {
  [key: string]: any;
}

describe("isPropsEqual", () => {
  it("should return true for identical objects", () => {
    const props: InstanceProps = { a: 1, b: "test", c: true };
    expect(isPropsEqual(props, props)).toBe(true);
  });

  it("should return true for empty objects", () => {
    expect(isPropsEqual({}, {})).toBe(true);
  });

  it("should return false for objects with different number of keys", () => {
    const prevProps: InstanceProps = { a: 1, b: 2 };
    const nextProps: InstanceProps = { a: 1, b: 2, c: 3 };
    expect(isPropsEqual(prevProps, nextProps)).toBe(false);
  });

  it("should return false when a key is present in one object but not the other", () => {
    const prevProps: InstanceProps = { a: 1, b: 2 };
    const nextProps: InstanceProps = { a: 1, c: 2 };
    expect(isPropsEqual(prevProps, nextProps)).toBe(false);
  });

  it("should return false when values are different for the same key", () => {
    const prevProps: InstanceProps = { a: 1, b: 2 };
    const nextProps: InstanceProps = { a: 1, b: 3 };
    expect(isPropsEqual(prevProps, nextProps)).toBe(false);
  });

  it("should return true for objects with same keys and values", () => {
    const prevProps: InstanceProps = { a: 1, b: "test", c: true };
    const nextProps: InstanceProps = { a: 1, b: "test", c: true };
    expect(isPropsEqual(prevProps, nextProps)).toBe(true);
  });

  it("should handle undefined keys correctly", () => {
    const prevProps: InstanceProps = { a: 1, b: undefined, c: 3 };
    const nextProps: InstanceProps = { a: 1, b: undefined, c: 3 };
    expect(isPropsEqual(prevProps, nextProps)).toBe(true);
  });

  it("should return true for objects with keys in different order", () => {
    const prevProps: InstanceProps = { a: 1, b: 2, c: 3 };
    const nextProps: InstanceProps = { b: 2, c: 3, a: 1 };
    expect(isPropsEqual(prevProps, nextProps)).toBe(true);
  });

  //TODO: Fix this test
  it.skip("should return true for objects with nested objects", () => {
    const prevProps: InstanceProps = { a: 1, b: { c: 2 } };
    const nextProps: InstanceProps = { a: 1, b: { c: 2 } };
    expect(isPropsEqual(prevProps, nextProps)).toBe(true);
  });

  it("should return false for objects with nested objects with different values", () => {
    const prevProps: InstanceProps = { a: 1, b: { c: 2 } };
    const nextProps: InstanceProps = { a: 1, b: { c: 3 } };
    expect(isPropsEqual(prevProps, nextProps)).toBe(false);
  });

  it.skip("should return true for objects with nested arrays", () => {
    const prevProps: InstanceProps = { a: 1, b: [1, 2, 3] };
    const nextProps: InstanceProps = { a: 1, b: [1, 2, 3] };
    expect(isPropsEqual(prevProps, nextProps)).toBe(true);
  });

  it("should return false for objects with nested arrays with different values", () => {
    const prevProps: InstanceProps = { a: 1, b: [1, 2, 3] };
    const nextProps: InstanceProps = { a: 1, b: [1, 2, 4] };
    expect(isPropsEqual(prevProps, nextProps)).toBe(false);
  });

  it("should return false for objects with nested arrays with different lengths", () => {
    const prevProps: InstanceProps = { a: 1, b: [1, 2, 3] };
    const nextProps: InstanceProps = { a: 1, b: [1, 2] };
    expect(isPropsEqual(prevProps, nextProps)).toBe(false);
  });

  //TODO: Fix this test
  it.skip("should return true for two react elements", () => {
    const element = React.createElement("div", {
      key: "test",
      onClick: () => {},
    }) as any;
    expect(isPropsEqual(element, element)).toBe(true);
  });

  //TODO: Fix this test
  it.skip("should return true for two react elements", () => {
    const element = React.createElement("div", {
      key: "test",
      onClick: () => {},
    }) as any;

    const element2 = React.createElement("div", {
      key: "test",
      onClick: () => {},
    }) as any;

    expect(isPropsEqual(element, element2)).toBe(true);
  });
});
