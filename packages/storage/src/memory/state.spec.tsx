/**
 * @jest-environment jsdom
 */

import React from "react";
import { StorageProvider } from "../storage.context";
import { MemoryStorage } from "./memory";
import { useState } from "./state";
import { act, fireEvent, render } from "@testing-library/react";

function Component() {
  const [counter, setCounter] = useState("some-key", 0);
  return (
    <div>
      <p>current: {counter}</p>
      <button onClick={() => setCounter(counter + 1)}>+</button>
    </div>
  );
}

function App() {
  return (
    <StorageProvider client={new MemoryStorage({} as any)}>
      <Component />
    </StorageProvider>
  );
}

describe("should be able to trigger a state change", () => {
  it("should be able to trigger a state change", () => {
    const { getByText } = render(<App />);
    expect(getByText("current: 0")).toBeTruthy();
    act(() => {
      fireEvent.click(getByText("+"));
    });
    expect(getByText("current: 1")).toBeTruthy();
  });
});
