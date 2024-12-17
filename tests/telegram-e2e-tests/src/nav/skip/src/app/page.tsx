import { PageProps } from "@rx-lab/common";
import { skip } from "@rx-lab/router";

export default function Page({ text }: PageProps) {
  if (text === "skip") {
    skip();
  }

  return <div>Page</div>;
}
