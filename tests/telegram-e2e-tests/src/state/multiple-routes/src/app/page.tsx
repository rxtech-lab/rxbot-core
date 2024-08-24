"use client";
import { CommandButton } from "@rx-lab/core";
import { useState } from "@rx-lab/storage";

export default function Page() {
  const [state, setState] = useState("counter", 0);

  return (
    <div>
      <h1>Page 1</h1>
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
          <CommandButton command={"/route2"} renderNewMessage={true}>
            Go to page 2
          </CommandButton>
        </div>
      </menu>
    </div>
  );
}
