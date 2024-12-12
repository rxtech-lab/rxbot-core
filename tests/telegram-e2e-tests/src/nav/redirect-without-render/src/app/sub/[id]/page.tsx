import { PageProps } from "@rx-lab/common";

export default function Page({ params }: PageProps) {
  const { id } = params;

  return <div>This is subpage {id}</div>;
}
