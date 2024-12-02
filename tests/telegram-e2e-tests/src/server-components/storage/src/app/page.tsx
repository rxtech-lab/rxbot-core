import { PageProps } from "@rx-lab/common";
import ClientComponent from "./client-component";

export default async function Page({ storage }: PageProps) {
  const state = await storage.restoreState<number>("test");
  return (
    <div>
      <span>Title: {state}</span>
      <ClientComponent />
    </div>
  );
}
