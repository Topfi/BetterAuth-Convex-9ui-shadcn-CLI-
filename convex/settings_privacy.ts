import { mutation, type MutationCtx } from "./_generated/server";

import {
  accountExportRequestResultSchema,
  purgeAccountResultSchema,
} from "../shared/settings/privacy";

const requireIdentitySubject = async (ctx: MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
};

export const requestExport = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentitySubject(ctx);

    // Placeholder: enqueue export job once transport is ready.
    return accountExportRequestResultSchema.parse({
      status: "scheduled" as const,
    });
  },
});

export const purgeAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const subject = await requireIdentitySubject(ctx);

    const ownedUsers = await ctx.db
      .query("users")
      .withIndex("by_identitySubject", (q) => q.eq("identitySubject", subject))
      .collect();
    await Promise.all(ownedUsers.map((doc) => ctx.db.delete(doc._id)));

    const pendingIdentities = await ctx.db
      .query("pendingIdentities")
      .withIndex("by_betterAuthUserId", (q) =>
        q.eq("betterAuthUserId", subject),
      )
      .collect();
    await Promise.all(pendingIdentities.map((doc) => ctx.db.delete(doc._id)));

    const usernameHolds = await ctx.db
      .query("usernameHolds")
      .withIndex("by_identitySubject", (q) => q.eq("identitySubject", subject))
      .collect();
    await Promise.all(usernameHolds.map((doc) => ctx.db.delete(doc._id)));

    const counters = await ctx.db
      .query("counters")
      .withIndex("by_userId", (q) => q.eq("userId", subject))
      .collect();
    await Promise.all(counters.map((doc) => ctx.db.delete(doc._id)));

    const auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_actorSubject", (q) => q.eq("actorSubject", subject))
      .collect();
    const ipHashes = new Set<string>();
    await Promise.all(auditLogs.map((doc) => ctx.db.delete(doc._id)));
    for (const log of auditLogs) {
      if (log.ipHash) {
        ipHashes.add(log.ipHash);
      }
    }

    for (const ipHash of ipHashes) {
      const rateLimitEntries = await ctx.db
        .query("authRateLimits")
        .withIndex("by_ipHash", (q) => q.eq("ipHash", ipHash))
        .collect();
      await Promise.all(rateLimitEntries.map((doc) => ctx.db.delete(doc._id)));
    }

    return purgeAccountResultSchema.parse({ success: true as const });
  },
});
