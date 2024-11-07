export const VERCEL_WEBHOOK_FUNCTION_TEMPLATE = `
import { Core } from "@rx-lab/core";
import { adapter, storage, ROUTE_FILE } from "{{outputDir}}/main.js";
import { waitUntil } from "@vercel/functions";

global.core = null;
export function POST(request: Request) {
    const result = async () => {
        if (global.core === null) {
            global.core = await Core.Start({
                adapter,
                storage,
                routeFile: ROUTE_FILE,
            });
        }
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
