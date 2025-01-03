import { LayoutProps } from "@rx-lab/common";
import { redirect } from "@rx-lab/router";

export default function Layout({ children, text }: LayoutProps) {
  if (text === "hi2") {
    redirect("/sub2");
  }

  return <div>{children}</div>;
}
