"use client";
import { useState } from "@rx-lab/storage";

export default function ClientComponent() {
  const [state, setState] = useState("test", 0);
  return (
    <div>
      <span>Sub component: {state}</span>
    </div>
  );
}
