export default async function ServerComponent() {
  await Promise.resolve();
  return (
    <div>
      <span>Sub component</span>
    </div>
  );
}
