"use client";

import { useState } from "@rx-lab/storage";
import { DateTimeNumberPad } from "./TimeNumberPad";

export function ConditionalComponent() {
  const [mode, setMode] = useState("mode", "default");
  const [counter, setCounter] = useState("counter", 0);
  const [startTime, setStartTime] = useState("startTime", "****-**-** **:**");

  if (mode === "default") {
    return (
      <div>
        <p>
          This is a conditional rendering demo. You can switch between two
          modes.
        </p>
        <h1>Start Time: {startTime}</h1>
        <DateTimeNumberPad
          onChange={(newValue) => {
            // biome-ignore lint/suspicious/noConsoleLog: <explanation>
            console.log("newValue", newValue);
            setStartTime(newValue);
          }}
          value={startTime}
        />
        <div>
          <button key={"mode"} onClick={() => setMode("counter")}>
            Switch to Counter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p>Counter: {counter}</p>
      <div>
        <button key={"default"} onClick={() => setMode("default")}>
          Switch to default
        </button>
      </div>
    </div>
  );
}
