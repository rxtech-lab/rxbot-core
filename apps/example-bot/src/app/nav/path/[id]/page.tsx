import { usePathname } from "@rx-lab/router/hooks";

export default function page() {
  const params = usePathname();

  return <div>Current ID: {params.pathParams.id}</div>;
}
