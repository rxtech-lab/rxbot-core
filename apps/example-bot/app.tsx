import React from "react";
import { StorageProvider } from "@rx-lab/storage";
import { useState } from "@rx-lab/storage";
import { MemoryStorage } from "@rx-lab/storage/memory";

const client = new MemoryStorage({} as any);
export function App() {
  return (
    <StorageProvider client={client}>
      <Home />
    </StorageProvider>
  );
}

function Home() {
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
