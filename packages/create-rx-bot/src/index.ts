#!/usr/bin/env node
import * as process from "node:process";
import {
  cancel,
  group,
  intro,
  isCancel,
  multiselect,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import render from "./render";
import {
  AdapterValue,
  PackageManagerValue,
  StorageValue,
  SupportedAdapter,
  SupportedPackageManager,
  SupportedStorage,
} from "./types";

const isDryRun = process.env.DRY_RUN === "true";
(async () => {
  intro(`create-rx-bot`);
  const grouped = await group({
    packageManager: () =>
      select<PackageManagerValue[], SupportedPackageManager>({
        message: `Pick a package manager`,
        options: [
          {
            value: "npm",
            label: "npm",
          },
          {
            value: "yarn",
            label: "yarn",
          },
          {
            value: "pnpm",
            label: "pnpm",
          },
        ],
      }),
    projectName: () =>
      text({
        message: "Enter the project name",
        placeholder: "my-rx-bot",
        validate: (value) =>
          value.length > 0 ? undefined : "Project name is required",
      }),
    storage: () =>
      select<StorageValue[], SupportedStorage>({
        message: `Pick a storage option`,
        options: [
          {
            value: "memory",
            label: "Memory",
            hint: "Useful for development. Stores data in memory",
          },
          {
            value: "file",
            label: "File",
            hint: "Stores data in a file",
          },
          {
            value: "upstash-redis",
            label: "Upstash Redis",
            hint: "Stores data in Upstash Redis. You need to provide a upstash url and token.",
          },
        ],
      }),
    adapters: () =>
      multiselect<AdapterValue[], SupportedAdapter>({
        message: `Pick an adapter`,
        options: [
          {
            value: "telegram",
            label: "Telegram",
            hint: "Build a bot for Telegram",
          },
        ],
        required: true,
      }),
  });

  for (const key in grouped) {
    if (isCancel(grouped[key])) {
      cancel("Project creation cancelled");
      return;
    }
  }
  const s = spinner();
  s.start(`Generating project files...`);
  await render(isDryRun, grouped).catch((e) => {
    s.stop(`Project files generation failed: ${e.message}`);
    throw e;
  });
  s.stop("Project files generated");
  outro(`You're all set!`);
})();
