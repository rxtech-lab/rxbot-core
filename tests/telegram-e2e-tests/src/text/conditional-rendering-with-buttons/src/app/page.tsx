import { PageProps } from "@rx-lab/common";
import { ClientArea } from "./component";

export default function Page({ text }: PageProps) {
  if (text !== "go-to-sub") {
    return <div>You need to say "go-to-sub" to go to sub</div>;
  }
  return (
    <div>
      <span>You just said: {text}</span>
      <ClientArea />
    </div>
  );
}
