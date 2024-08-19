"use client";
import { CommandButton } from "@rx-lab/core/dist";
import { useState } from "@rx-lab/storage";
import React from "react";

export default function Page() {
  const [state, setState] = useState("counter", 0);

  return (
    <div>
      <h1>Page 2</h1>
      <hr />
      <p>Choose an option</p>
      <hr />
      <p>Current state: {state}</p>
      <menu>
        <div>
          <button
            key={"button10"}
            onClick={() => {
              setState(state + 1);
            }}
          >
            +1
          </button>
          <button
            key={"button11"}
            onClick={() => {
              setState(state - 1);
            }}
          >
            -1
          </button>
        </div>
        <div>
          <CommandButton command={"/"} renderNewMessage={false}>
            Go to page 1
          </CommandButton>
          <button
            key={"button12"}
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
