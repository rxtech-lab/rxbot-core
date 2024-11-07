export const VERCEL_WEBHOOK_FUNCTION_TEMPLATE = `
import { Core } from "@rx-lab/core";
import { adapter, storage, ROUTE_FILE } from "{{outputDir}}/main.js";
import { waitUntil } from "@vercel/functions";

global.core = null;
export async function POST(request: Request) {
    if (global.core === null) {
        global.core = await Core.Start({
            adapter,
            storage,
            routeFile: ROUTE_FILE,
        });
    }
    const result = async () => {
        await global.core.handleMessageUpdate(await request.json());
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
`;
