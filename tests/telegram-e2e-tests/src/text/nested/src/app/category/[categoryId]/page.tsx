import { PageProps } from "@rx-lab/common";
import { Component } from "./component";

export default function page(props: PageProps) {
  console.log("props", props);
  if (!props.text) {
    return <div>Enter an item id</div>;
  }

  return <Component />;
}
