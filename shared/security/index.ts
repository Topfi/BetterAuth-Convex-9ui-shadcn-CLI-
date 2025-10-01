import { z } from "zod";

export const securityEventSchema = z.enum([
  "sign_in_success",
  "sign_in_rate_limited",
  "sign_up_success",
  "passphrase_reset_requested",
  "passphrase_rejected",
  "two_factor_challenge",
  "account_deleted",
  "generated_applet_committed",
]);

export type SecurityEvent = z.infer<typeof securityEventSchema>;

export const securityLogLevelSchema = z.enum([
  "debug",
  "info",
  "warn",
  "error",
]);

export type SecurityLogLevel = z.infer<typeof securityLogLevelSchema>;

export const securityLogDetailsSchema = z.record(z.string(), z.string());

export const securityLogPayloadSchema = z.object({
  event: securityEventSchema,
  level: securityLogLevelSchema,
  message: z.string(),
  path: z.string(),
  actorSubject: z.string().optional(),
  ipAddress: z.string().optional(),
  details: securityLogDetailsSchema.optional(),
  requestId: z.string().optional(),
});

export type SecurityLogPayload = z.infer<typeof securityLogPayloadSchema>;

export const sensitiveRateLimitPaths = [
  "/sign-in/email",
  "/sign-up/email",
  "/forget-password",
  "/reset-password",
  "/two-factor/send-otp",
  "/two-factor/verify-otp",
  "/two-factor/verify-totp",
  "/two-factor/enable",
  "/two-factor/disable",
  "/delete-user",
] as const;

export type SensitiveRateLimitPath = (typeof sensitiveRateLimitPaths)[number];

export const sensitiveRateLimitPathSchema = z.enum([
  ...sensitiveRateLimitPaths,
] as [SensitiveRateLimitPath, ...SensitiveRateLimitPath[]]);
