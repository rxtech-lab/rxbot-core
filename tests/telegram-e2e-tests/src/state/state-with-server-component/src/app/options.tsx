"use client";

import { useState } from "@rx-lab/storage";

export function Options() {
  const [state1, setState1] = useState("state1", 0.1);
  const [state2, setState2] = useState("state2", 0.1);

  return (
    <div>
      <p>Here are the states:</p>
      <p>State 1: {state1}</p>
      <p>State 2: {state2}</p>
      <div>
        <div>
          <button
            key={"state1"}
            onClick={() => {
              setState1(0.1);
            }}
          >
            State 1 {state1 === 0.1 ? "✅ 0.1" : "0.1"}
          </button>
          <button
            key={"state2"}
            onClick={() => {
              setState1(0.2);
            }}
          >
            State 1 {state1 === 0.2 ? "✅ 0.2" : "0.2"}
          </button>
          <button
            key={"state3"}
            onClick={() => {
              setState1(0.3);
            }}
          >
            State 1 {state1 === 0.3 ? "✅ 0.3" : "0.3"}
          </button>
        </div>
        <div>
          <button
            key={"state4"}
            onClick={() => {
              setState2(0.1);
            }}
          >
            State 2 {state2 === 0.1 ? "✅ 0.1" : "0.1"}
          </button>
          <button
            key={"state5"}
            onClick={() => {
              setState2(0.2);
            }}
          >
            State 2 {state2 === 0.2 ? "✅ 0.2" : "0.2"}
          </button>
          <button
            key={"state6"}
            onClick={() => {
              setState2(0.3);
            }}
          >
            State 2 {state2 === 0.3 ? "✅ 0.3" : "0.3"}
          </button>
        </div>
      </div>
    </div>
  );
}
