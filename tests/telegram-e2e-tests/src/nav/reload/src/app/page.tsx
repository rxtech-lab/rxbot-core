"use client";
import { PageProps } from "@rx-lab/common";
import { useRouter } from "@rx-lab/router/hooks";

export default function Page({ text }: PageProps) {
  const { reload } = useRouter();

  return (
    <div>
      <span>This is the home page with text: {text}</span>
      <button key={"reload"} onClick={() => reload()}>
        Reload
      </button>
      <button
        key={"reload-2"}
        onClick={() => reload({ shouldRenderNewMessage: true })}
      >
        Reload with new message
      </button>
    </div>
  );
}
