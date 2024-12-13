import { RouteMetadata } from "@rx-lab/common";
import { CommandButton } from "@rx-lab/core";

export const metadata: RouteMetadata = {
  title: "Functions",
  description: "Learn the basic functions comes from core package",
  includeInMenu: true,
};

export default function page() {
  return (
    <div>
      <h1>Core provide a lot of functions to try on</h1>
      <div>
        <CommandButton command={"/functions/wait"}>
          WaitUntil Demo
        </CommandButton>
      </div>
    </div>
  );
}
