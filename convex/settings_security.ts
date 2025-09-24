import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { getUser, getAdapterWithUserOperations } from "./auth";
import {
  rotatePassphraseInputSchema,
  securityOverviewSchema,
  type SecurityOverview,
} from "../shared/settings/security";
import {
  assertAcceptablePassphrase,
  PassphraseValidationError,
} from "../shared/passphrase-strength";

type AuthUser = Awaited<ReturnType<typeof getUser>>;

const hasPasswordField = (
  user: AuthUser,
): user is AuthUser & { password?: string | null } =>
  typeof user === "object" && user !== null && "password" in user;

const hasTwoFactorField = (
  user: AuthUser,
): user is AuthUser & { twoFactorEnabled?: boolean | null } =>
  typeof user === "object" && user !== null && "twoFactorEnabled" in user;

const hasEmailField = (
  user: AuthUser,
): user is AuthUser & { email?: string | null } =>
  typeof user === "object" && user !== null && "email" in user;

const hasNameField = (
  user: AuthUser,
): user is AuthUser & { name?: string | null } =>
  typeof user === "object" && user !== null && "name" in user;

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
};

const buildStatus = (hasPassphrase: boolean, twoFactorEnabled: boolean) => {
  const risks: SecurityOverview["risks"] = [];
  if (!hasPassphrase) {
    risks.push({
      id: "missing_passphrase",
      level: "high",
      message: "Add a passphrase to secure sign-in beyond magic links.",
    });
  }
  if (hasPassphrase && !twoFactorEnabled) {
    risks.push({
      id: "missing_2fa",
      level: "medium",
      message:
        "Enable two-factor authentication to add another verification step.",
    });
  }

  return risks;
};

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    let hasPassphrase = false;
    let twoFactorEnabled = false;

    try {
      const authUser = await getUser(ctx);
      if (authUser) {
        if (hasPasswordField(authUser)) {
          hasPassphrase = Boolean(authUser.password);
        }
        if (hasTwoFactorField(authUser)) {
          twoFactorEnabled = Boolean(authUser.twoFactorEnabled);
        }
      }
    } catch {
      hasPassphrase = false;
      twoFactorEnabled = false;
    }

    const risks = buildStatus(hasPassphrase, twoFactorEnabled);

    const overview: SecurityOverview = {
      hasPassphrase,
      twoFactorEnabled,
      risks,
    };

    return securityOverviewSchema.parse(overview);
  },
});

export const rotatePassphrase = mutation({
  args: {
    passphrase: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const subject = identity.subject;
    const { passphrase } = rotatePassphraseInputSchema.parse(args);

    const metadata: Array<string | null | undefined> = [];

    if ("email" in identity) {
      metadata.push((identity as { email?: string | null }).email ?? null);
    }

    let authUser: AuthUser | null;
    try {
      authUser = await getUser(ctx as unknown as QueryCtx);
    } catch {
      authUser = null;
    }

    if (authUser) {
      if (hasEmailField(authUser)) {
        metadata.push(authUser.email ?? null);
      }
      if (hasNameField(authUser)) {
        metadata.push(authUser.name ?? null);
      }
    }

    try {
      assertAcceptablePassphrase({
        passphrase,
        metadata,
      });
    } catch (error) {
      if (error instanceof PassphraseValidationError) {
        const payload = {
          event: "passphrase_rejected",
          level: "warn",
          message: "Rejected passphrase during rotation",
          path: "convex.settings_security.rotatePassphrase",
          actorSubject: subject,
          details: {
            reason: error.reason,
            score: String(error.evaluation.score),
            metadataMatched: String(error.reason === "contains_metadata"),
          },
        } as const;

        try {
          if (
            "scheduler" in ctx &&
            ctx.scheduler &&
            typeof ctx.scheduler.runAfter === "function"
          ) {
            void ctx.scheduler.runAfter(
              0,
              internal.auditLogs.recordSecurityEvent,
              payload,
            );
          } else if (
            "runMutation" in ctx &&
            typeof ctx.runMutation === "function"
          ) {
            await ctx.runMutation(
              internal.auditLogs.recordSecurityEvent,
              payload,
            );
          }
        } catch (loggingError) {
          console.error(
            "[settings_security] Failed to log passphrase rejection",
            loggingError,
          );
        }
      }

      throw error;
    }

    // TODO: integrate with Better Auth password hashing once exposed.
    const adapter = getAdapterWithUserOperations(ctx);
    await adapter.update({
      model: "user",
      where: [{ field: "id", operator: "eq", value: subject }],
      update: {
        password: passphrase,
        updatedAt: Date.now(),
      },
    });

    return { ok: true } as const;
  },
});
