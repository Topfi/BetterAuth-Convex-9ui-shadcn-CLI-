import { z } from "zod";

export const ACCOUNT_EXPORT_DELIVERY_WINDOW_HOURS = 24;

export const accountExportRequestResultSchema = z.object({
  status: z.literal("scheduled"),
});

export type AccountExportRequestResult = z.infer<
  typeof accountExportRequestResultSchema
>;

export const accountDeletionConfirmationSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .min(1, "Enter your username to confirm deletion."),
});

export type AccountDeletionConfirmation = z.infer<
  typeof accountDeletionConfirmationSchema
>;

export const purgeAccountResultSchema = z.object({
  success: z.literal(true),
});

export type PurgeAccountResult = z.infer<typeof purgeAccountResultSchema>;
