"use client";

import { useState } from "@rx-lab/storage";

export function ConditionalComponent() {
  const [mode, setMode] = useState("mode", "default");
  const [counter, setCounter] = useState("counter", 0);
  const [modeChangeCounter, setModeChangeCounter] = useState(
    "modeChangeCounter",
    0,
  );

  if (mode === "default") {
    return (
      <div>
        <p>
          This is a conditional rendering demo. You can switch between two
          modes.
        </p>
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
