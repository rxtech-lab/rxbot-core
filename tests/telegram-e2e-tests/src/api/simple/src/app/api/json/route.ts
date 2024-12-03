import { FunctionRequest } from "@rx-lab/common";

export function GET({ req }: FunctionRequest) {
  return new Response(
    JSON.stringify({
      message: "Hello world",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
