"use client";
import { useState } from "@rx-lab/storage";

export default function Page() {
  const [state, setState] = useState("counter", 0);
  const [state2, setState2] = useState("counter2", 0);
  const [state3, setState3] = useState("counter3", 0);

  return (
    <div>
      <h1>Welcome to the Telegram Bot!</h1>
      <hr />
      <p>Choose an option</p>
      <hr />
      <p>Current state: {state}</p>
      <p>Current state2: {state2}</p>
      <p>Current state3: {state3}</p>
      <div>
        <div>
          <button
            key={"button1"}
            onClick={() => {
              setState(state + 1);
            }}
          >
            +1
          </button>
          <button
            key={"button2"}
            onClick={() => {
              setState(state - 1);
            }}
          >
            -1
          </button>
        </div>
        <div>
          <button
            key={"button3"}
            onClick={() => {
              setState(0);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
