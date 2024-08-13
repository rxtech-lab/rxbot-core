import { isDefaultExportAsync } from "./utils";

describe("isDefaultExportAsync", () => {
  const ASYNC_COMPONENT = `
    export default async function Page() {
        return <div>This is a subpage</div>;
        }
        `;

  const SYNC_COMPONENT = `
    export default function Page() {
        return <div>This is a subpage</div>;
        }
        `;

  it("should return true for async default export", () => {
    const result = isDefaultExportAsync(ASYNC_COMPONENT);

    expect(result).toBe(true);
  });

  it("should return false for sync default export", () => {
    const result = isDefaultExportAsync(SYNC_COMPONENT);

    expect(result).toBe(false);
  });

  it("should return false for no default export", () => {
    const result = isDefaultExportAsync("");
    expect(result).toBe(false);
  });
});
