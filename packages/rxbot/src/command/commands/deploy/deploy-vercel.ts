import { existsSync } from "fs";
import { execSync } from "node:child_process";
import path from "path";
import { Logger } from "@rx-lab/common";

export default async function deploy() {
  // check if .vercel/output exists
  const VERCEL_OUTPUT = ".vercel/output";
  const VERCEL_OUTPUT_PATH = path.resolve(VERCEL_OUTPUT);

  if (!existsSync(VERCEL_OUTPUT_PATH)) {
    throw new Error(`Vercel output folder not found at ${VERCEL_OUTPUT_PATH}`);
  }
  // run vercel deploy --prod --prebuilt
  // check error
  execSync("vercel deploy --prod --prebuilt", {
    stdio: "inherit",
  });
  Logger.info("Deployed to Vercel", "green");
}
