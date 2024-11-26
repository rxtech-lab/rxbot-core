import { PageProps, RouteMetadata } from "@rx-lab/common";
import { redirect } from "@rx-lab/router";

export const metadata: RouteMetadata = {
  title: "Echo",
  description: "Echoes the text you send",
  includeInMenu: true,
};

export default function Page({ text }: PageProps) {
  if (!text) {
    return <div>Enter a category id</div>;
  }

  redirect(`/category/${text}`);
}
