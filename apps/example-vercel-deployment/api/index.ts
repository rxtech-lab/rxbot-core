import path from "path";
import { Core } from "@rx-lab/core";

export async function GET(request: Request) {
  const core = await Core.Start({
    outputDir: path.join(__dirname, "../.rx-lab"),
  });
  const body = await request.json();
  await core.handleMessageUpdate(body);
  return new Response("Hello, world!", {
    headers: { "content-type": "text/plain" },
  });
}
