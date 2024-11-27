import { ErrorPageProps } from "@rx-lab/common";

export default function ErrorPage({ error, code }: ErrorPageProps) {
  return (
    <div>
      <h1>{code}</h1>
      <p>Custom: {error.message}</p>
    </div>
  );
}
