import { PageProps } from "@rx-lab/common";
import { ConfigurationArea } from "./config";
import { ContextProvider } from "./context";

export default async function page({ userId }: PageProps) {
  return (
    <ContextProvider>
      <ConfigurationArea id={"some_id"} userId={userId} />
    </ContextProvider>
  );
}
