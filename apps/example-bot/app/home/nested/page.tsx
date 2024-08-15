import { PageProps, RouteMetadata } from "@rx-lab/common";
import React from "react";

export const metadata: RouteMetadata = {
  title: "Nested Page",
  description: "This is a nested page",
  includeInMenu: true,
};

export default function Page(props: PageProps) {
  const currentSearchQuery = props.searchQuery;
  const data = currentSearchQuery.data;

  return (
    <div>
      This is a nested page
      <p>Current data: {data}</p>
    </div>
  );
}
