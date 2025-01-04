import { LayoutProps } from "@rx-lab/common";
import { redirect } from "@rx-lab/router";

export default function Layout(props: LayoutProps) {
  if (props.text === "hi") {
    redirect("/sub");
  }

  return <div>{props.children}</div>;
}
