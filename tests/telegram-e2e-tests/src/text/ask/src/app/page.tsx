import { CommandButton } from "@rx-lab/core";

export default function Page() {
  return (
    <div>
      <span>Go to ask page</span>
      <CommandButton command={"/ask"}>Ask</CommandButton>
    </div>
  );
}
