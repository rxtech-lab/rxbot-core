"use client";

import { useState } from "@rx-lab/storage";

export function Component() {
  const [isBought, setIsBought] = useState("buy", false);
  return (
    <div>
      <div>Is bought:{isBought ? "Yes" : "No"}</div>
      <button
        key={"buy"}
        onClick={() => {
          setIsBought(true);
        }}
      >
        Buy item
      </button>
    </div>
  );
}
