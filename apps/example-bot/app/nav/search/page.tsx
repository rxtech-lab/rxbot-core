import { useSearchParams } from "@rx-lab/router/hooks";

export default function page() {
  const params = useSearchParams();

  return (
    <div>
      <p>Search params: {params.text}</p>
    </div>
  );
}
