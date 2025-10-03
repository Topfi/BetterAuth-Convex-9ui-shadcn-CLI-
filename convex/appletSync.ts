import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

type WithAuthCtx = QueryCtx | MutationCtx;

const requireIdentitySubject = async (ctx: WithAuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
};

const actionSchema = v.object({
  timeSinceBatchStart: v.number(),
  position: v.object({
    x: v.number(),
    y: v.number(),
    z: v.number(),
  }),
  size: v.object({
    width: v.number(),
    height: v.number(),
  }),
});

export const store = mutation({
  args: {
    workspaceId: v.number(),
    nodeId: v.string(),
    actions: v.array(actionSchema),
  },
  handler: async (ctx, args) => {
    const { workspaceId, nodeId, actions } = args;
    const subject = await requireIdentitySubject(ctx);

    // Authorization: ensure the workspace belongs to the current identity
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", workspaceId),
      )
      .unique();

    if (!workspace) throw new Error("Workspace not found");

    const existing = await ctx.db
      .query("appletTransformBatches")
      .withIndex("by_workspaceId_nodeId", (q) =>
        q.eq("workspaceId", workspaceId).eq("nodeId", nodeId),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("appletTransformBatches", {
        workspaceId,
        nodeId,
        actions,
      });
      return { inserted: true as const };
    }

    await ctx.db.patch(existing._id, { actions });
    return { inserted: false as const };
  },
});

export const find = query({
  args: {
    workspaceId: v.number(),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const { workspaceId, nodeId } = args;
    const subject = await requireIdentitySubject(ctx);

    // Authorization: ensure the workspace belongs to the current identity
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", workspaceId),
      )
      .unique();

    if (!workspace) return null;

    const existing = await ctx.db
      .query("appletTransformBatches")
      .withIndex("by_workspaceId_nodeId", (q) =>
        q.eq("workspaceId", workspaceId).eq("nodeId", nodeId),
      )
      .unique();

    return existing ?? null;
  },
});

