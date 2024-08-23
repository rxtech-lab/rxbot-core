import { RouteMetadata } from "@rx-lab/common";
import { Command, CommandButton } from "@rx-lab/core";

export const metadata: RouteMetadata = {
  title: "Navigation",
  description: "Learn how to navigate between pages",
  includeInMenu: true,
};

export default function page() {
  return (
    <div>
      <p>
        Just like any other bot, we provide you a good way to navigate between
        different pages. Whether it is a inlined navigation, navigation to an
        external link, or a navigation replacement, we have got you covered.
      </p>
      <br />
      <br />
      <p>
        You can navigate to the <Command>/state</Command> like this. Or click
        the inline button below.
      </p>
      <p>
        You can also use the powerful `searchParams` and `pathParams` to
        navigate to a specific page with the information you need. Check out the
        inline button below.
      </p>
      <menu>
        <div>
          <CommandButton command="/state">State Management</CommandButton>
        </div>
        <div>
          <CommandButton command={"/nav/search?text=hello"}>
            Navigate to Hello
          </CommandButton>
          <CommandButton command={"/nav/search?text=world"}>
            Navigate to World
          </CommandButton>
        </div>
        <div>
          <CommandButton command={"/nav/path/1"}>
            Navigate to Post 1
          </CommandButton>
        </div>
        <div>
          <CommandButton command={"/nav/redirect"}>
            Navigate to redirect example
          </CommandButton>
        </div>
      </menu>
    </div>
  );
}
