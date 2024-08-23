import { PageProps } from "@rx-lab/common";
import { redirect } from "@rx-lab/router";

export default function Page({ text }: PageProps) {
  if (text === "redirect") {
    redirect("/");
  }

  return (
    <div>This is the redirect page. Type: `redirect` to redirect to Home</div>
  );
}
