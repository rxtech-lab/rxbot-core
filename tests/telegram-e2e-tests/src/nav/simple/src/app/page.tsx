import { CommandButton } from "@rx-lab/core/dist/src";
import React from "react";

export default function Page() {
  return (
    <div>
      This is the home page
      <menu>
        <CommandButton command={`/sub/1`} renderNewMessage={true}>
          Go to subpage 1
        </CommandButton>
      </menu>
    </div>
  );
}
