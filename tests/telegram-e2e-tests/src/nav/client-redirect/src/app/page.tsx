"use client";
import { useRouter } from "@rx-lab/router/hooks";

export default function Page() {
  const { redirectTo } = useRouter();

  return (
    <div>
      <div>This is the home page</div>
      <div>
        <div>
          <button
            key={"redirect"}
            onClick={async () => {
              await redirectTo("/sub/1");
            }}
          >
            Redirect
          </button>
        </div>
      </div>
    </div>
  );
}
