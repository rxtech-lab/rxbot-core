import { PageProps } from "@rx-lab/common";

export default function page({ text }: PageProps) {
  if (!text) {
    return (
      <div>
        <span>Enter a text to display</span>
      </div>
    );
  }

  return (
    <div>
      <span>You entered: {text}</span>
    </div>
  );
}
