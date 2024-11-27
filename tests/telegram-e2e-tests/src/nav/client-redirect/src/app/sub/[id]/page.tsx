import { PageProps } from "@rx-lab/common";

export default function Page({ params, userId }: PageProps) {
  const { id } = params;

  return (
    <div>
      This is subpage {id} with userId {`${userId}`}
    </div>
  );
}
