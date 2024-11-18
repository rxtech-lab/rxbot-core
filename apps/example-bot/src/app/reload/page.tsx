"use client";

import { PageProps } from "@rx-lab/common";
import { useRouter } from "@rx-lab/router/hooks";

export default function Page({ text }: PageProps) {
  const router = useRouter();
  const now = new Date().toISOString();
  return (
    <div>
      <span>
        This is the home page with text: {text} and {now}
      </span>
      <button key={"reload"} onClick={() => router.reload()}>
        Reload
      </button>
    </div>
  );
}
