import { PageProps } from "@rx-lab/common";

export default function Page({ text }: PageProps) {
  if (!text) {
    return <p>Enter something</p>;
  }

  if (text === "error") {
    throw new Error("🔴 Custom error message");
  }
}
