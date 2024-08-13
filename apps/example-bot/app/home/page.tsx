import { RouteMetadata } from "@rx-lab/common";

export const metadata: RouteMetadata = {
  title: "Subpage",
  description: "This is a subpage",
  includeInMenu: true,
};

export default function Page() {
  return <div>Home page</div>;
}
