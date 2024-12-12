import { redirect } from "@rx-lab/router";

async function functionWithCallback(callback: () => Promise<void>) {
  await callback();
}

export default async function Page() {
  await functionWithCallback(() => {
    redirect("/sub/1");
  });

  return <div>Page 2</div>;
}
