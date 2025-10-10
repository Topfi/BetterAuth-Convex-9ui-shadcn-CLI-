import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createFunctionHandle, type FunctionHandle } from "convex/server";
import { Crons } from "@convex-dev/crons";
import { components, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  normalizeUsername,
  usernameFromEmail,
  type NormalizedUsername,
  usernameDisplaySchema,
  usernameLowerSchema,
  USERNAME_TAKEN_ERROR,
  AUTOCLAIM_FAILURE_MESSAGE,
  pendingIdentityInputSchema,
  buildPendingIdentityRecord,
  normalizeEmail,
} from "../shared/identity";
import { getUser, getAdapterWithUserOperations } from "./auth";
import {
  emailUpdateSchema,
  profileImageUpdateSchema,
} from "../shared/settings_profile";
import { USERNAME_HOLD_DURATION_MS } from "../shared/settings_profile/holds";
const AUTOCLAIM_MAX_ATTEMPTS = 100;

const cleanupCrons = new Crons(components.crons);
const PENDING_IDENTITY_CLEANUP_NAME = "identityPendingCleanupHourly" as const;
const PENDING_IDENTITY_CLEANUP_SCHEDULE = {
  kind: "interval",
  ms: 24 * 60 * 60 * 1000,
} as const;
const USERNAME_HOLD_CLEANUP_NAME = "identityUsernameHoldCleanupHourly" as const;
const USERNAME_HOLD_CLEANUP_SCHEDULE = {
  kind: "cron",
  cronspec: "0 * * * *",
} as const;

type UserDocument = Doc<"users">;
type PendingIdentityDocument = Doc<"pendingIdentities">;
type UsernameHoldDocument = Doc<"usernameHolds">;

type WithAuthCtx = QueryCtx | MutationCtx;

const getPendingIdentityByUserId = async (
  ctx: WithAuthCtx,
  betterAuthUserId: string,
) =>
  ctx.db
    .query("pendingIdentities")
    .withIndex("by_betterAuthUserId", (q) =>
      q.eq("betterAuthUserId", betterAuthUserId),
    )
    .unique();

const getPendingIdentityByUsernameLower = async (
  ctx: WithAuthCtx,
  usernameLower: string,
) =>
  ctx.db
    .query("pendingIdentities")
    .withIndex("by_usernameLower", (q) => q.eq("usernameLower", usernameLower))
    .first();

const deletePendingIdentity = async (
  ctx: MutationCtx,
  pending: PendingIdentityDocument,
) => {
  await ctx.db.delete(pending._id);
};

const getActiveUsernameHold = async (
  ctx: MutationCtx,
  usernameLower: string,
  now: number,
): Promise<UsernameHoldDocument | null> => {
  const hold = await ctx.db
    .query("usernameHolds")
    .withIndex("by_usernameLower", (q) => q.eq("usernameLower", usernameLower))
    .first();

  if (!hold) {
    return null;
  }

  if (hold.releaseAt <= now) {
    await ctx.db.delete(hold._id);
    return null;
  }

  return hold;
};

const throwIfUsernameOnHold = async (
  ctx: MutationCtx,
  usernameLower: string,
  now: number,
) => {
  const hold = await getActiveUsernameHold(ctx, usernameLower, now);
  if (hold) {
    throw new Error(USERNAME_TAKEN_ERROR);
  }
};

const createUsernameHold = async (
  ctx: MutationCtx,
  identitySubject: string,
  username: NormalizedUsername,
  now: number,
) => {
  await ctx.db.insert("usernameHolds", {
    identitySubject,
    usernameLower: username.lower,
    usernameDisplay: username.display,
    releaseAt: now + USERNAME_HOLD_DURATION_MS,
    createdAt: now,
  });
};

const requireIdentity = async (ctx: WithAuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
};

const requireIdentitySubject = async (ctx: WithAuthCtx) =>
  (await requireIdentity(ctx)).subject;

const getUserByIdentity = async (ctx: WithAuthCtx, identitySubject: string) =>
  ctx.db
    .query("users")
    .withIndex("by_identitySubject", (q) =>
      q.eq("identitySubject", identitySubject),
    )
    .unique();

const getUserByLower = async (ctx: WithAuthCtx, usernameLower: string) =>
  ctx.db
    .query("users")
    .withIndex("by_usernameLower", (q) => q.eq("usernameLower", usernameLower))
    .unique();

const upsertUser = async (
  ctx: MutationCtx,
  identitySubject: string,
  normalized: NormalizedUsername,
) => {
  const existing = await getUserByIdentity(ctx, identitySubject);
  if (!existing) {
    await ctx.db.insert("users", {
      identitySubject,
      usernameLower: normalized.lower,
      usernameDisplay: normalized.display,
    });
    return;
  }

  await ctx.db.patch(existing._id, {
    usernameLower: normalized.lower,
    usernameDisplay: normalized.display,
  });
};

const clampCandidateDisplay = (baseDisplay: string, suffix: string) => {
  const maxBaseLength = 32 - suffix.length;
  if (maxBaseLength < 3) {
    return null;
  }
  const trimmed = baseDisplay.slice(0, Math.max(maxBaseLength, 0));
  if (trimmed.length < 3) {
    return null;
  }
  return `${trimmed}${suffix}`;
};

const buildCandidate = (
  base: NormalizedUsername,
  attempt: number,
): NormalizedUsername | null => {
  if (attempt === 0) {
    return base;
  }

  const suffix = `${attempt}`;
  const candidateDisplay = clampCandidateDisplay(base.display, suffix);
  if (!candidateDisplay) {
    return null;
  }

  const display = usernameDisplaySchema.parse(candidateDisplay);
  const lower = usernameLowerSchema.parse(candidateDisplay.toLowerCase());
  return { display, lower } satisfies NormalizedUsername;
};

const claimWithRetries = async (
  ctx: MutationCtx,
  subject: string,
  base: NormalizedUsername,
): Promise<NormalizedUsername | null> => {
  for (let attempt = 0; attempt < AUTOCLAIM_MAX_ATTEMPTS; attempt += 1) {
    const candidate = buildCandidate(base, attempt);
    if (!candidate) {
      continue;
    }
    const hold = await getActiveUsernameHold(ctx, candidate.lower, Date.now());
    if (hold) {
      continue;
    }
    const collision = await getUserByLower(ctx, candidate.lower);
    if (collision && collision.identitySubject !== subject) {
      continue;
    }

    await upsertUser(ctx, subject, candidate);

    const verify = await getUserByLower(ctx, candidate.lower);
    if (verify && verify.identitySubject === subject) {
      return candidate;
    }
  }

  return null;
};

const ensureUsernameForSubject = async (
  ctx: MutationCtx,
  subject: string,
  preferred: NormalizedUsername,
): Promise<NormalizedUsername> => {
  const now = Date.now();
  await throwIfUsernameOnHold(ctx, preferred.lower, now);
  const collision = await getUserByLower(ctx, preferred.lower);
  if (collision && collision.identitySubject !== subject) {
    const claimed = await claimWithRetries(ctx, subject, preferred);
    if (!claimed) {
      throw new Error(AUTOCLAIM_FAILURE_MESSAGE);
    }
    return claimed;
  }

  await upsertUser(ctx, subject, preferred);
  return preferred;
};

const deriveUsernameFromNameOrEmail = (
  name: string | undefined | null,
  email: string,
): NormalizedUsername => {
  if (name) {
    const condensed = name.replace(/[^A-Za-z0-9]/g, "");
    if (condensed.length >= 3) {
      const truncated = condensed.slice(0, 32);
      try {
        return normalizeUsername(truncated);
      } catch {
        // Fall through to email-derived username if sanitized name is still invalid.
      }
    }
  }

  return usernameFromEmail(email);
};

type AutoclaimResult =
  | { ok: true; username: NormalizedUsername }
  | { ok: false; reason: "conflict"; message: string };

const autoclaimWithEmail = async (
  ctx: MutationCtx,
  subject: string,
  email: string,
): Promise<AutoclaimResult> => {
  const existing = await getUserByIdentity(ctx, subject);

  if (existing?.usernameLower && existing?.usernameDisplay) {
    return {
      ok: true,
      username: {
        lower: existing.usernameLower,
        display: existing.usernameDisplay,
      },
    } as const;
  }

  const { original: trimmedEmail } = normalizeEmail(email);
  const base = usernameFromEmail(trimmedEmail);
  try {
    const claimed = await ensureUsernameForSubject(ctx, subject, base);
    return { ok: true, username: claimed } as const;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : AUTOCLAIM_FAILURE_MESSAGE;
    return {
      ok: false,
      reason: "conflict",
      message,
    } as const;
  }
};

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const subject = await requireIdentitySubject(ctx);
    const user = await getUserByIdentity(ctx, subject);
    if (!user) {
      return null;
    }

    return {
      usernameDisplay: user.usernameDisplay,
      usernameLower: user.usernameLower,
    } satisfies Pick<UserDocument, "usernameDisplay" | "usernameLower">;
  },
});

export const reserveUsername = mutation({
  args: {
    display: v.string(),
  },
  handler: async (ctx, { display }) => {
    const subject = await requireIdentitySubject(ctx);
    const normalized = normalizeUsername(display);
    await throwIfUsernameOnHold(ctx, normalized.lower, Date.now());
    const collision = await getUserByLower(ctx, normalized.lower);

    if (collision && collision.identitySubject !== subject) {
      throw new Error(USERNAME_TAKEN_ERROR);
    }

    await upsertUser(ctx, subject, normalized);
    return { ok: true } as const;
  },
});

export const autoclaimUsernameFromEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const subject = await requireIdentitySubject(ctx);
    return autoclaimWithEmail(ctx, subject, email);
  },
});

export const autoclaimUsernameFromSession = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        ok: false,
        reason: "not_authenticated" as const,
        message: AUTOCLAIM_FAILURE_MESSAGE,
      } as const;
    }

    const now = Date.now();
    let pending = await getPendingIdentityByUserId(ctx, identity.subject);
    if (pending && pending.expiresAt <= now) {
      await deletePendingIdentity(ctx, pending);
      pending = null;
    }

    if (pending) {
      const username = await ensureUsernameForSubject(ctx, identity.subject, {
        lower: pending.usernameLower,
        display: pending.usernameDisplay,
      });
      await deletePendingIdentity(ctx, pending);
      return { ok: true, username } as const;
    }

    let email: string | null = identity.email ?? null;
    try {
      const authUser = await getUser(ctx);
      email = authUser.email ?? email;
    } catch {
      // ignore errors from Better Auth lookups and fall back to identity email
    }

    if (!email) {
      return {
        ok: false,
        reason: "no_email" as const,
        message: AUTOCLAIM_FAILURE_MESSAGE,
      } as const;
    }

    return autoclaimWithEmail(ctx, identity.subject, email);
  },
});

export const updateUsername = mutation({
  args: {
    display: v.string(),
  },
  handler: async (ctx, { display }) => {
    const subject = await requireIdentitySubject(ctx);
    const normalized = normalizeUsername(display);
    const now = Date.now();
    await throwIfUsernameOnHold(ctx, normalized.lower, now);

    const existingUser = await getUserByIdentity(ctx, subject);
    if (
      existingUser &&
      existingUser.usernameLower === normalized.lower &&
      existingUser.usernameDisplay === normalized.display
    ) {
      return { ok: true } as const;
    }

    const collision = await getUserByLower(ctx, normalized.lower);

    if (collision && collision.identitySubject !== subject) {
      throw new Error(USERNAME_TAKEN_ERROR);
    }

    if (
      existingUser &&
      existingUser.usernameLower &&
      existingUser.usernameDisplay &&
      existingUser.usernameLower !== normalized.lower
    ) {
      await createUsernameHold(
        ctx,
        subject,
        {
          lower: existingUser.usernameLower,
          display: existingUser.usernameDisplay,
        },
        now,
      );
    }

    await upsertUser(ctx, subject, normalized);

    // Will back the forthcoming Settings rename flow.
    // auditLogs.trackUsernameChange(ctx, subject, normalized); // TODO: add audit logging hook.
    return { ok: true } as const;
  },
});

export const requestEmailChange = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = emailUpdateSchema.parse(args);
    const identity = await requireIdentity(ctx);
    const normalized = normalizeEmail(email);
    const adapter = getAdapterWithUserOperations(ctx);

    const existing = await adapter.findOne({
      model: "user",
      where: [{ field: "email", operator: "eq", value: normalized.original }],
    });

    if (existing && existing.id !== identity.subject) {
      throw new Error("That email is already in use. Try another.");
    }

    await adapter.update({
      model: "user",
      where: [{ field: "_id", operator: "eq", value: identity.subject }],
      update: {
        email: normalized.original,
        emailVerified: false,
        updatedAt: Date.now(),
      },
    });

    return { ok: true } as const;
  },
});

export const updateProfileImage = mutation({
  args: {
    image: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const subject = await requireIdentitySubject(ctx);
    const parsed = profileImageUpdateSchema.parse({ image: args.image });

    const adapter = getAdapterWithUserOperations(ctx);
    await adapter.update({
      model: "user",
      where: [{ field: "_id", operator: "eq", value: subject }],
      update: {
        image: parsed.image ?? null,
        updatedAt: Date.now(),
      },
    });

    return { ok: true } as const;
  },
});

export const stagePendingIdentity = mutation({
  args: {
    betterAuthUserId: v.string(),
    email: v.string(),
    username: v.string(),
    imageBase64: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sanitizedInput = {
      ...args,
      imageBase64:
        args.imageBase64 && args.imageBase64.length > 0
          ? args.imageBase64
          : undefined,
    } satisfies {
      betterAuthUserId: string;
      email: string;
      username: string;
      imageBase64?: string | undefined;
    };

    const parsed = pendingIdentityInputSchema.parse(sanitizedInput);
    const now = Date.now();
    const record = buildPendingIdentityRecord(parsed, now);

    const activeHold = await getActiveUsernameHold(
      ctx,
      record.usernameLower,
      now,
    );
    if (activeHold) {
      throw new Error(USERNAME_TAKEN_ERROR);
    }

    const userCollision = await getUserByLower(ctx, record.usernameLower);
    if (
      userCollision &&
      userCollision.identitySubject !== record.betterAuthUserId
    ) {
      throw new Error(USERNAME_TAKEN_ERROR);
    }

    const pendingCollision = await getPendingIdentityByUsernameLower(
      ctx,
      record.usernameLower,
    );
    if (
      pendingCollision &&
      pendingCollision.betterAuthUserId !== record.betterAuthUserId
    ) {
      throw new Error(USERNAME_TAKEN_ERROR);
    }

    const emailCollision = await ctx.db
      .query("pendingIdentities")
      .withIndex("by_emailLower", (q) => q.eq("emailLower", record.emailLower))
      .first();
    if (
      emailCollision &&
      emailCollision.betterAuthUserId !== record.betterAuthUserId
    ) {
      throw new Error(
        "This email already has a pending verification. Try signing in instead.",
      );
    }

    let existing = await getPendingIdentityByUserId(
      ctx,
      record.betterAuthUserId,
    );

    if (existing && existing.expiresAt <= now) {
      await deletePendingIdentity(ctx, existing);
      existing = null;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: record.email,
        emailLower: record.emailLower,
        usernameLower: record.usernameLower,
        usernameDisplay: record.usernameDisplay,
        imageBase64: record.imageBase64,
        expiresAt: record.expiresAt,
      });
    } else {
      await ctx.db.insert("pendingIdentities", record);
    }

    return { ok: true } as const;
  },
});

export const finalizePendingIdentity = internalMutation({
  args: {
    betterAuthUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { betterAuthUserId, email, name: providedName }) => {
    const now = Date.now();
    let pending = await getPendingIdentityByUserId(ctx, betterAuthUserId);
    if (pending && pending.expiresAt <= now) {
      await deletePendingIdentity(ctx, pending);
      pending = null;
    }

    const { original: trimmedEmail } = normalizeEmail(email);
    const preferred = pending
      ? ({
          lower: pending.usernameLower,
          display: pending.usernameDisplay,
        } satisfies NormalizedUsername)
      : deriveUsernameFromNameOrEmail(providedName, trimmedEmail);

    const username = await ensureUsernameForSubject(
      ctx,
      betterAuthUserId,
      preferred,
    );

    if (pending) {
      await deletePendingIdentity(ctx, pending);
    }

    return { ok: true, username } as const;
  },
});

export const cleanupExpiredPendingIdentities = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const batchSize = 100;
    let removed = 0;

    while (true) {
      const expired = await ctx.db
        .query("pendingIdentities")
        .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
        .take(batchSize);
      if (expired.length === 0) {
        break;
      }

      await Promise.all(
        expired.map(async (entry) => {
          await ctx.db.delete(entry._id);
        }),
      );
      removed += expired.length;

      if (expired.length < batchSize) {
        break;
      }
    }

    return { ok: true, removed } as const;
  },
});

export const cleanupExpiredUsernameHolds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const batchSize = 100;
    let removed = 0;

    while (true) {
      const expired = await ctx.db
        .query("usernameHolds")
        .withIndex("by_releaseAt", (q) => q.lt("releaseAt", now))
        .take(batchSize);

      if (expired.length === 0) {
        break;
      }

      await Promise.all(expired.map((entry) => ctx.db.delete(entry._id)));
      removed += expired.length;

      if (expired.length < batchSize) {
        break;
      }
    }

    return { ok: true, removed } as const;
  },
});

export const ensurePendingIdentityCleanupCron = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ ok: true; created: boolean; id: string }> => {
    const existing = await cleanupCrons.get(ctx, {
      name: PENDING_IDENTITY_CLEANUP_NAME,
    });

    const expectedHandle: FunctionHandle<"mutation" | "action"> =
      await createFunctionHandle(
        internal.identity.cleanupExpiredPendingIdentities,
      );

    let scheduleMatches = false;
    if (existing) {
      if (existing.schedule.kind === "interval") {
        scheduleMatches =
          existing.schedule.ms === PENDING_IDENTITY_CLEANUP_SCHEDULE.ms;
      }
    }

    const functionMatches = existing?.functionHandle === expectedHandle;
    const argsMatches = existing
      ? Object.keys(existing.args).length === 0
      : false;

    if (existing && scheduleMatches && functionMatches && argsMatches) {
      return { ok: true, created: false, id: existing.id } as const;
    }

    if (existing) {
      await cleanupCrons.delete(ctx, { name: PENDING_IDENTITY_CLEANUP_NAME });
    }

    const id: string = await cleanupCrons.register(
      ctx,
      PENDING_IDENTITY_CLEANUP_SCHEDULE,
      internal.identity.cleanupExpiredPendingIdentities,
      {},
      PENDING_IDENTITY_CLEANUP_NAME,
    );

    return { ok: true, created: true, id } as const;
  },
});

export const ensureUsernameHoldCleanupCron = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ ok: true; created: boolean; id: string }> => {
    const existing = await cleanupCrons.get(ctx, {
      name: USERNAME_HOLD_CLEANUP_NAME,
    });

    const expectedHandle: FunctionHandle<"mutation" | "action"> =
      await createFunctionHandle(internal.identity.cleanupExpiredUsernameHolds);

    let scheduleMatches = false;
    if (existing) {
      if (existing.schedule.kind === "cron") {
        const expectedTz = (USERNAME_HOLD_CLEANUP_SCHEDULE as { tz?: string })
          .tz;
        scheduleMatches =
          existing.schedule.cronspec ===
            USERNAME_HOLD_CLEANUP_SCHEDULE.cronspec &&
          (existing.schedule.tz ?? undefined) === (expectedTz ?? undefined);
      }
    }

    const functionMatches = existing?.functionHandle === expectedHandle;
    const argsMatches = existing
      ? Object.keys(existing.args).length === 0
      : false;

    if (existing && scheduleMatches && functionMatches && argsMatches) {
      return { ok: true, created: false, id: existing.id } as const;
    }

    if (existing) {
      await cleanupCrons.delete(ctx, {
        name: USERNAME_HOLD_CLEANUP_NAME,
      });
    }

    const id: string = await cleanupCrons.register(
      ctx,
      USERNAME_HOLD_CLEANUP_SCHEDULE,
      internal.identity.cleanupExpiredUsernameHolds,
      {},
      USERNAME_HOLD_CLEANUP_NAME,
    );

    return { ok: true, created: true, id } as const;
  },
});
