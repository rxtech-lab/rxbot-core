#!/usr/bin/env node

import * as packageJson from "../package.json";
import { render } from "./render";

(async () => {
  console.info("Creating Rx Bot...", process.env.NODE_ENV);
  const isProd = process.env.NODE_ENV === "production";
  const version = isProd ? packageJson.version : "latest";
  await render(version);
})();
