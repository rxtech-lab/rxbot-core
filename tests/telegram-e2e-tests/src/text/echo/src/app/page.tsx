import { PageProps, RouteMetadata } from "@rx-lab/common";

export const metadata: RouteMetadata = {
  title: "Echo",
  description: "Echoes the text you send",
  includeInMenu: true,
};

export default function Page({ text }: PageProps) {
  if (!text) {
    return (
      <div>
        Hi, I'm an echo bot. Send me a message and I'll echo it back to you.
      </div>
    );
  }

  return <div>You just said: {text}</div>;
}
