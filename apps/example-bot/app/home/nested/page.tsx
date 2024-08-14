import { RouteMetadata } from "@rx-lab/common";
import React from "react";

export const metadata: RouteMetadata = {
  title: "Nested Page",
  description: "This is a nested page",
  includeInMenu: true,
};

export default function Page() {
  return <div>This is a nested page</div>;
}
