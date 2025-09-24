import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Returns the current user's counter value (defaults to 0 if not created yet)
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0; // UI should already gate by auth; safe default
    const userId = identity.subject;

    const row = await ctx.db
      .query("counters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return row?.value ?? 0;
  },
});

// Increment the current user's counter by `increment` (can be negative)
export const increment = mutation({
  args: { increment: v.number() },
  handler: async (ctx, { increment }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const existing = await ctx.db
      .query("counters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const now = Date.now();
    if (!existing) {
      await ctx.db.insert("counters", {
        userId,
        value: increment,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        value: existing.value + increment,
        updatedAt: now,
      });
    }
  },
});
