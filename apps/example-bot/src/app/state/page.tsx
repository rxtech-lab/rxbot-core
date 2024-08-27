import { RouteMetadata } from "@rx-lab/common";
import { CommandButton } from "@rx-lab/core";

export const metadata: RouteMetadata = {
  title: "State Management",
  description: "Learn how to manage states in your bot",
  includeInMenu: true,
};

export default function page() {
  return (
    <div>
      <h1>Use State Demo</h1>
      <p>
        State management is a fundamental aspect of the Rx-Lab framework. We
        offer a straightforward approach to managing states in your bot, which
        differs from traditional single-page web applications.
      </p>
      <br />
      <br />
      <h1>Key Difference</h1>
      <p>
        Unlike web applications, bot states cannot be stored directly in the
        application. Instead, Rx-Lab utilizes external storage for state
        management.
      </p>
      <div>
        <CommandButton command={"/state/counter"}>Counter Demo</CommandButton>
      </div>
    </div>
  );
}
