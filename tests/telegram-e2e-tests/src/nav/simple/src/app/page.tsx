import { CommandButton } from "@rx-lab/core";
import { SOME_DATA } from "../lib/data";

export default function Page() {
  return (
    <div>
      This is the home page: {SOME_DATA}
      <menu>
        <CommandButton command={`/sub/1`} renderNewMessage={true}>
          Go to subpage 1
        </CommandButton>
      </menu>
    </div>
  );
}
