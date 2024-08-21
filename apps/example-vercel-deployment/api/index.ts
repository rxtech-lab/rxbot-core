import path from "path";
import { Core } from "@rx-lab/core";

export function GET(request: Request) {
  const core = Core.Start({
    outputDir: path.join(__dirname, "../.rx-lab"),
  });
  return new Response("Hello, world!", {
    headers: { "content-type": "text/plain" },
  });
}
