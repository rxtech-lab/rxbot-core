import * as path from "path";
import build from "./build";

// mock console.error
jest.spyOn(console, "error").mockImplementation(() => {});
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("build.vercel", () => {
  it("should be able to run on vercel", async () => {
    process.env.API_KEY = "123";
    process.env.WEBHOOK = `http://0.0.0.0:9000/webhook/chatroom/1`;
    await build("./example", undefined, { environment: "vercel" });
    const filePath = path.resolve(
      "./.vercel/output/functions/api/webhook.func/index.js",
    );
    const mod = await import(
      //@ts-ignore
      filePath
    );
    const postFunc = mod.POST;
    // mock request
    const request = {
      json: () => {
        return {};
      },
    };
    const response: Response = await postFunc(request);
    expect(response).toBeDefined();
    const responseBody = await response.json();
    expect(responseBody.status).toBe("ok");
    await sleep(500);
    const consoleErrorCalls = (console.error as jest.Mocked<any>).mock.calls;
    if (consoleErrorCalls.length > 0) {
      expect(consoleErrorCalls[0][0].message).not.toContain("is required");
    }
  });
});
