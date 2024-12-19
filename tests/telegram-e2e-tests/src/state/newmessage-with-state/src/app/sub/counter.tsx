"use client";

import { CommandButton } from "@rx-lab/core";
import { useState } from "@rx-lab/storage";

export function Counter() {
  const [state, setState] = useState("counter", 0);

  return (
    <div>
      <h1>Welcome to the Telegram Bot!</h1>
      <hr />
      <p>Choose an option</p>
      <hr />
      <p>Current state: {state}</p>
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
        <CommandButton command={"/"} renderNewMessage>
          Home
        </CommandButton>
      </div>
    </div>
  );
}
