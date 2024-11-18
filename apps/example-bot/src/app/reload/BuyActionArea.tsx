"use client";

import { CommandButton } from "@rx-lab/core";
import { useRouter } from "@rx-lab/router/hooks";

export function BuyActionArea({ token }: { token: string }) {
  const router = useRouter();
  return (
    <div>
      <div>
        <CommandButton command="/">← Back</CommandButton>
        <button key={"buy-refresh"} onClick={() => router.reload()}>
          Refresh
        </button>
      </div>
      <div>
        <button>✅ 0.01 SOL</button>
        <button>0.1 SOL</button>
        <button>0.5 SOL</button>
      </div>
      <div>
        <button>1 SOL</button>
        <button>2 SOL</button>
        <button>X SOL ✏</button>
      </div>
      <div>
        <button>✅ 15% Slippage</button>
        <button>X Slippage ✏</button>
      </div>
      <div>
        <CommandButton command={`/buy/${token}`}>Buy</CommandButton>
      </div>
    </div>
  );
}
