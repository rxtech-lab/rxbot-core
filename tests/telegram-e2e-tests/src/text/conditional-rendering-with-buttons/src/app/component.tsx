"use client";

import { useRouter } from "@rx-lab/router/hooks";

export function ClientArea() {
  const router = useRouter();

  return (
    <div>
      <button
        key={"refresh"}
        onClick={async () => {
          await router.reload();
        }}
      >
        Refresh
      </button>
    </div>
  );
}
