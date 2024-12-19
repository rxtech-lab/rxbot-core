"use client";

import { ErrorPageProps } from "@rx-lab/common";
import { useRouter } from "@rx-lab/router/hooks";
import { useEffect } from "react";

export default function ErrorPage({ error, code }: ErrorPageProps) {
  const router = useRouter();
  useEffect(() => {
    router.redirectTo("/", {
      renderNewMessage: false,
      shouldRender: false,
      shouldAddToHistory: true,
    });
  }, []);

  return (
    <div>
      <h1>{code}</h1>
      <p>Custom: {error.message}</p>
    </div>
  );
}
