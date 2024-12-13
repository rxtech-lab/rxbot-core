"use client";

import { waitUntil } from "@rx-lab/core/functions";
import { useRouter } from "@rx-lab/router/hooks";
import { useEffect } from "react";

async function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export default function page() {
  const router = useRouter();

  useEffect(() => {
    const asyncFunc = async () => {
      await sleep(10_000);
      await router.redirectTo("/functions/wait/sub");
    };
    waitUntil(asyncFunc());
  }, []);
  return <div>First page</div>;
}
