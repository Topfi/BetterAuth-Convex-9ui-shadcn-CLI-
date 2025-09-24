import { z } from "zod";

import { passphraseSchema } from "../../auth-schemas";

export const securityRiskSchema = z.object({
  id: z.string(),
  level: z.enum(["low", "medium", "high"]),
  message: z.string(),
});

export type SecurityRisk = z.infer<typeof securityRiskSchema>;

export const securityOverviewSchema = z.object({
  hasPassphrase: z.boolean(),
  twoFactorEnabled: z.boolean(),
  risks: z.array(securityRiskSchema),
});

export type SecurityOverview = z.infer<typeof securityOverviewSchema>;

export const rotatePassphraseInputSchema = z.object({
  passphrase: passphraseSchema,
});

export type RotatePassphraseInput = z.infer<typeof rotatePassphraseInputSchema>;
