import ClientComponent from "./client-component";
import ServerComponent from "./server-component";

const AsyncComponent = ServerComponent as any;

export default async function Page() {
  await Promise.resolve();
  return (
    <div>
      <span>Title</span>
      <AsyncComponent />
      <ClientComponent />
    </div>
  );
}
