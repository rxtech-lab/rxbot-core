import { PageProps } from "@rx-lab/common";
import { Component } from "./component";

export default function page({ text }: PageProps) {
  if (!text) {
    return <div>Enter an item id</div>;
  }

  return <Component />;
}
