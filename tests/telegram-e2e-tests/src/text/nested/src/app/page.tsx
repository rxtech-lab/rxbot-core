import { PageProps } from "@rx-lab/common";
import { CommandButton } from "@rx-lab/core";

export default function page({ text }: PageProps) {
  return (
    <div>
      <span>Welcome to the category page</span>
      <CommandButton command={"/category"}>Buy</CommandButton>
    </div>
  );
}
