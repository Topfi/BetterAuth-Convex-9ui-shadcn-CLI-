import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

import {
  defaultThemeSettings,
  themeSettingsSchema,
  themeSettingsUpdateSchema,
} from "../shared/settings/theme";

const requireIdentity = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
};

export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_identitySubject", (q) =>
        q.eq("identitySubject", identity.subject),
      )
      .first();

    if (!existing) {
      return defaultThemeSettings;
    }

    return themeSettingsSchema.parse(existing.theme);
  },
});

export const updatePreferences = mutation({
  args: {
    mode: v.union(v.literal("light"), v.literal("dark")),
    backgroundPattern: v.union(
      v.literal("cross"),
      v.literal("dots"),
      v.literal("lines"),
      v.literal("none"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const parsed = themeSettingsUpdateSchema.parse(args);

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_identitySubject", (q) =>
        q.eq("identitySubject", identity.subject),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        theme: parsed,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userSettings", {
        identitySubject: identity.subject,
        theme: parsed,
        updatedAt: Date.now(),
      });
    }

    return parsed;
  },
});
