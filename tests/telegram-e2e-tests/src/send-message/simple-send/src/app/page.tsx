import { PageProps, RouteMetadata } from "@rx-lab/common";

export const metadata: RouteMetadata = {
  title: "Send Message",
  description: "Send a message to user",
  includeInMenu: true,
};

export default function Page({ text, data }: PageProps) {
  return (
    <div>
      <div>You just said: {text}</div>
      <div>{JSON.stringify(data ?? {})}</div>
    </div>
  );
}
