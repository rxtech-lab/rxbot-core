export default async function TestComponent1() {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return true;
}
