import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

import {
  defaultLocalizationSettings,
  localizationSettingsSchema,
  localizationSettingsUpdateSchema,
} from "../shared/settings/localization";
import { defaultThemeSettings } from "../shared/settings/theme";

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

    if (!existing || !existing.localization) {
      return defaultLocalizationSettings;
    }

    return localizationSettingsSchema.parse(existing.localization);
  },
});

export const updatePreferences = mutation({
  args: {
    timeZone: v.union(v.literal("system"), v.string()),
    dateFormat: v.union(
      v.literal("system"),
      v.literal("dayMonthYear"),
      v.literal("monthDayYear"),
      v.literal("iso8601"),
    ),
    timeFormat: v.union(
      v.literal("system"),
      v.literal("twelveHour"),
      v.literal("twentyFourHour"),
    ),
    showSeconds: v.boolean(),
    language: v.literal("en"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const parsed = localizationSettingsUpdateSchema.parse(args);

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_identitySubject", (q) =>
        q.eq("identitySubject", identity.subject),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        localization: parsed,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userSettings", {
        identitySubject: identity.subject,
        theme: defaultThemeSettings,
        localization: parsed,
        updatedAt: Date.now(),
      });
    }

    return parsed;
  },
});
