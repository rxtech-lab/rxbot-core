"use client";
import { useRouter } from "@rx-lab/router/hooks";
import { useState } from "@rx-lab/storage";
import { Utils } from "@rx-lab/testing";

export default function ClientComponent() {
  const [state, setState] = useState<number>("test", 0);
  const router = useRouter();
  return (
    <div>
      <button
        key={"increment"}
        onClick={async () => {
          setState(state + 1);
          await Utils.sleep(500);
          await router.reload();
        }}
      >
        Increment
      </button>
    </div>
  );
}
