import { z } from "zod";

export const GENERATED_APPLET_FILE_TOTAL_MAX = 200 * 1024; // 200 KB total across all files
export const GENERATED_APPLET_FILE_COUNT_MAX = 12;
export const GENERATED_APPLET_ALLOWED =
  /^\/(App|index)\.(t|j)sx?$|^\/components\/[A-Za-z0-9_\-/]+\.(t|j)sx?$/;

export const zGeneratedAppletMeta = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  minSize: z
    .object({
      width: z.number().int().min(160),
      height: z.number().int().min(120),
    })
    .optional(),
});

export type GeneratedAppletMeta = z.infer<typeof zGeneratedAppletMeta>;
export type SandpackFiles = Record<string, string>;
