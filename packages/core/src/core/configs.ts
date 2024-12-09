import process from "node:process";

export const DEFAULT_DEBOUNCE_RENDERING_TIME = 100; // 0.1s
export const DEFAULT_TIMEOUT =
  process.env.NODE_ENV === "development" ? 20 * 1000 : 2 * 1000; // 2 seconds if in production, 20 seconds if in debug mode
