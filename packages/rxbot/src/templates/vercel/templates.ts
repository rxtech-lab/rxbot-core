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
        await global.core.handleMessageUpdate(request, await request.json());
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

export const VERCEL_API_ROUTE_TEMPLATE = `
import { Core } from "@rx-lab/core";
import { adapter, storage, ROUTE_FILE } from "{{outputDir}}/main.js";
import { waitUntil } from "@vercel/functions";
import { matchRouteWithPath } from "@rx-lab/router";

global.core = null;
{% for method in methods %}
export async function {{method}}(req: Request) {
      if (global.core === null) {
          global.core = await Core.Start({
              adapter,
              storage,
              routeFile: ROUTE_FILE,
          });
      }
      const matchedRoute = await matchRouteWithPath(
              ROUTE_FILE.routes,
              "{{path}}"
            );
      const api = matchedRoute.api;
      const handler = api["{{method}}"];
      const functionRequest = {
              req,
              storage: storage,
              routeInfoFile: ROUTE_FILE,
              core: global.core,
            };
      const resp = await handler(functionRequest);
      return resp;
}
{% endfor %}
`;
