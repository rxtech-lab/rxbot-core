import path from "path";
import { Core } from "@rx-lab/core";
import { waitUntil } from "@vercel/functions";

global.core = null;

export async function POST(request: Request) {
  const body = await request.json();

  const result = async () => {
    if (global.core === null) {
      global.core = await Core.Start({
        outputDir: path.join(__dirname, "../../.rx-lab"),
      });
    }
    await global.core.handleMessageUpdate(body);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  waitUntil(result().catch(console.error));
  return new Response(
    JSON.stringify({
      status: "ok",
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    },
  );
}
