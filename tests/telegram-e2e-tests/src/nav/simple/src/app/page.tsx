import { CommandButton } from "@rx-lab/core";

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
