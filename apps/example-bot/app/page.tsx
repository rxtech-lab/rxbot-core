import { useState } from "@rx-lab/storage";
import React from "react";

export default function Page() {
  const [] = useState("key", 1);

  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
