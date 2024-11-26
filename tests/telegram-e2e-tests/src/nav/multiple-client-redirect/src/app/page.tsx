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
              await redirectTo("/page1", {
                shouldRender: true,
                shouldAddToHistory: false,
              });
              setTimeout(async () => {
                await redirectTo("/page2", {
                  shouldRender: true,
                  shouldAddToHistory: false,
                });
              }, 100);
            }}
          >
            Redirect
          </button>
        </div>
      </div>
    </div>
  );
}
