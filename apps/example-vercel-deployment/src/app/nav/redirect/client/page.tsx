"use client";

import { useRouter } from "@rx-lab/router/hooks";

export default function page() {
  const { redirectTo } = useRouter();

  return (
    <div>
      <span>This is a client side redirect example</span>
      <menu>
        <button
          key={"redirect"}
          onClick={async () => {
            await redirectTo("/");
          }}
        >
          Redirect to the home page
        </button>
      </menu>
    </div>
  );
}
