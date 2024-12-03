import { FunctionRequest } from "@rx-lab/common";

export function GET({ req }: FunctionRequest) {
  return new Response("Hello world", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
