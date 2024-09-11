"use client";
import { useState } from "@rx-lab/storage";

export default function Page() {
  const [state, setState] = useState("counter", 0);

  return (
    <div>
      <div>
        <button
          key={"button3"}
          onClick={() => {
            setState(0);
          }}
        >
          Reset {state} to 0
        </button>
      </div>
    </div>
  );
}
