import { Options } from "./options";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function page() {
  await sleep(1000);
  return (
    <div>
      <p>This is a page</p>
      <Options />
    </div>
  );
}
