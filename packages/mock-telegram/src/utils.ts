/**
 * Utility function to sleep for a given time
 * @param ms
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
