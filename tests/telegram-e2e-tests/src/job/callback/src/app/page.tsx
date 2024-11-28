"use client";

import { useRouter } from "@rx-lab/router/hooks";

async function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
export default function Page() {
  const router = useRouter();
  return (
    <div>
      <span>This is a page with a callback error.</span>
      <button
        key={"button"}
        onClick={async () => {
          await sleep(6_000);
          await router.redirectTo("/finish");
        }}
      >
        Click
      </button>
    </div>
  );
}
