import { CommandButton } from "@rx-lab/core";

export default function Page() {
  return (
    <div>
      <span>Home</span>
      <div>
        <CommandButton command={"/error"}>Go to error</CommandButton>
      </div>
    </div>
  );
}
