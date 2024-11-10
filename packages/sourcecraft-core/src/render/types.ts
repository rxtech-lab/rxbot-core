import { z } from "zod";

export const HookSchema = z.union([
  z.object({
    type: z.enum(["shell"]),
    command: z.string(),
  }),
  z.object({
    type: z.enum(["node"]),
    script: z.string(),
  }),
]);

export const TemplateFileSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      output: z.string(),
      hooks: z
        .object({
          afterEmit: HookSchema.optional(),
          afterAllEmit: HookSchema.optional(),
        })
        .optional(),
    }),
  ),
});

export type TemplateFile = z.infer<typeof TemplateFileSchema>;
export type Hooks = z.infer<typeof TemplateFileSchema>["files"][0]["hooks"];
export type HooksKey = keyof Hooks;
