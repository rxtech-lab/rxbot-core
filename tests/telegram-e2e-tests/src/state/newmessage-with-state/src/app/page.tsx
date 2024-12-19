import { CommandButton } from "@rx-lab/core";

export default function page() {
  return (
    <div>
      <p>Home</p>
      <div>
        <CommandButton command={"/sub"}>Counter</CommandButton>
      </div>
    </div>
  );
}
