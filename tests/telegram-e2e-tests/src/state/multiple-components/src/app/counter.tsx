"use client";

import { useState } from "@rx-lab/storage";

type Props = {};

export default function Counter(props: Props) {
  const [state, setState] = useState("counter", 0);

  return (
    <div>
      <h1>Welcome to the Telegram Bot!</h1>
      <hr />
      <p>Choose an option</p>
      <hr />
      <p>Current state: {state}</p>
      <menu>
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
      </menu>
    </div>
  );
}
