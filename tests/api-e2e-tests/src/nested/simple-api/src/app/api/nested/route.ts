export function GET() {
  return new Response(
    JSON.stringify({
      message: "Hello, world!",
    }),
    { status: 200 },
  );
}

export function POST() {
  return new Response(
    JSON.stringify({
      message: "Hello, world!",
    }),
    { status: 200 },
  );
}
