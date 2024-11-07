import { RouteMetadata } from "@rx-lab/common";

export const metadata: RouteMetadata = {
  title: "Home",
  description: "The home page",
};

export default function page() {
  return (
    <div>
      <h1>Hello, welcome</h1>
    </div>
  );
}
