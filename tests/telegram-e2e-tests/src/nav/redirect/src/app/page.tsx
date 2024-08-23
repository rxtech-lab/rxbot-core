import { PageProps } from "@rx-lab/common";
import { redirect } from "@rx-lab/router";
import React from "react";

export default function Page({ text }: PageProps) {
  if (text === "redirect") {
    redirect("/sub/1");
  }

  return <div>This is the home page</div>;
}
