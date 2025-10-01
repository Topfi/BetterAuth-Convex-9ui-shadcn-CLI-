import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

import {
  workspaceDefinitionSchema,
  workspaceDefinitionsSchema,
  workspaceIdSchema,
  workspaceNameSchema,
  workspaceNodeSchema,
  workspaceNodePositionSchema,
  workspaceNodeSizeSchema,
  workspaceNodesResponseSchema,
  workspaceViewportSchema,
  type WorkspaceNodePosition,
} from "../shared/workspace";

type WithAuthCtx = QueryCtx | MutationCtx;

const requireIdentitySubject = async (ctx: WithAuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
};

const mapWorkspaceDefinition = (workspace: {
  workspaceId: number;
  name: string;
}) =>
  workspaceDefinitionSchema.parse({
    id: workspace.workspaceId,
    name: workspace.name,
  });

const sortWorkspaceDefinitions = (
  left: { name: string },
  right: { name: string },
) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" });

export const getWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const subject = await requireIdentitySubject(ctx);
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject", (q) => q.eq("identitySubject", subject))
      .collect();

    const definitions = rows
      .map((workspace) =>
        mapWorkspaceDefinition({
          workspaceId: workspace.workspaceId,
          name: workspace.name,
        }),
      )
      .sort(sortWorkspaceDefinitions);

    return workspaceDefinitionsSchema.parse(definitions);
  },
});

export const bootstrapWorkspaces = mutation({
  args: {},
  handler: async (ctx) => {
    const subject = await requireIdentitySubject(ctx);

    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject", (q) => q.eq("identitySubject", subject))
      .collect();

    if (existing.length > 0) {
      const normalized = existing
        .map((workspace) =>
          mapWorkspaceDefinition({
            workspaceId: workspace.workspaceId,
            name: workspace.name,
          }),
        )
        .sort(sortWorkspaceDefinitions);

      return workspaceDefinitionsSchema.parse(normalized);
    }

    const discoveredIds = new Set<number>();

    const nodeWorkspaces = await ctx.db
      .query("workspaceNodes")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject),
      )
      .collect();

    for (const node of nodeWorkspaces) {
      discoveredIds.add(node.workspaceId);
    }

    const viewportWorkspaces = await ctx.db
      .query("workspaceViewports")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject),
      )
      .collect();

    for (const viewport of viewportWorkspaces) {
      discoveredIds.add(viewport.workspaceId);
    }

    if (discoveredIds.size === 0) {
      discoveredIds.add(1);
    }

    const now = Date.now();
    const definitions: Array<{ workspaceId: number; name: string }> = [];

    for (const workspaceId of Array.from(discoveredIds).sort((a, b) => a - b)) {
      const name = workspaceNameSchema.parse(`Workspace ${workspaceId}`);
      await ctx.db.insert("workspaces", {
        identitySubject: subject,
        workspaceId,
        name,
        createdAt: now,
        updatedAt: now,
      });
      definitions.push({ workspaceId, name });
    }

    return workspaceDefinitionsSchema.parse(
      definitions
        .map((workspace) =>
          mapWorkspaceDefinition({
            workspaceId: workspace.workspaceId,
            name: workspace.name,
          }),
        )
        .sort(sortWorkspaceDefinitions),
    );
  },
});

export const createWorkspace = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = await requireIdentitySubject(ctx);
    const name = workspaceNameSchema.parse(args.name);

    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject", (q) => q.eq("identitySubject", subject))
      .collect();

    const usedIds = new Set(existing.map((workspace) => workspace.workspaceId));
    let nextId = 1;
    while (usedIds.has(nextId)) {
      nextId += 1;
    }

    const now = Date.now();
    await ctx.db.insert("workspaces", {
      identitySubject: subject,
      workspaceId: nextId,
      name,
      createdAt: now,
      updatedAt: now,
    });

    return workspaceDefinitionSchema.parse({ id: nextId, name });
  },
});

export const deleteWorkspace = mutation({
  args: {
    workspaceId: v.number(),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = args;
    workspaceIdSchema.parse(workspaceId);

    const subject = await requireIdentitySubject(ctx);

    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", workspaceId),
      )
      .unique();

    if (!existing) {
      return null;
    }

    const totalWorkspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_identitySubject", (q) => q.eq("identitySubject", subject))
      .collect();

    if (totalWorkspaces.length <= 1) {
      throw new Error("Cannot delete the last workspace");
    }

    const nodes = await ctx.db
      .query("workspaceNodes")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", workspaceId),
      )
      .collect();

    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    const viewports = await ctx.db
      .query("workspaceViewports")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", workspaceId),
      )
      .collect();

    for (const viewport of viewports) {
      await ctx.db.delete(viewport._id);
    }

    await ctx.db.delete(existing._id);

    return mapWorkspaceDefinition({
      workspaceId: existing.workspaceId,
      name: existing.name,
    });
  },
});

const upsertWorkspaceNode = async (
  ctx: MutationCtx,
  subject: string,
  workspaceId: number,
  nodeId: string,
  payload: {
    appletId: string;
    label: string;
    position: WorkspaceNodePosition;
    size: { width: number; height: number };
  },
) => {
  const existing = await ctx.db
    .query("workspaceNodes")
    .withIndex("by_identitySubject_workspaceId_nodeId", (q) =>
      q
        .eq("identitySubject", subject)
        .eq("workspaceId", workspaceId)
        .eq("nodeId", nodeId),
    )
    .unique();
  const now = Date.now();
  const position = workspaceNodePositionSchema.parse(payload.position);
  if (!existing) {
    await ctx.db.insert("workspaceNodes", {
      identitySubject: subject,
      workspaceId,
      nodeId,
      appletId: payload.appletId,
      label: payload.label,
      position,
      size: payload.size,
      createdAt: now,
      updatedAt: now,
    });
    return {
      workspaceId,
      id: nodeId,
      appletId: payload.appletId,
      label: payload.label,
      position,
      size: payload.size,
    } as const;
  }

  const next = {
    label: payload.label,
    position,
    size: payload.size,
    updatedAt: now,
  } as const;

  await ctx.db.patch(existing._id, next);

  return {
    workspaceId,
    id: nodeId,
    appletId: existing.appletId,
    label: next.label,
    position: next.position,
    size: next.size,
  } as const;
};

export const getNodes = query({
  args: {
    workspaceId: v.number(),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = args;
    workspaceIdSchema.parse(workspaceId);
    const subject = await requireIdentitySubject(ctx);

    const nodes = await ctx.db
      .query("workspaceNodes")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", workspaceId),
      )
      .collect();

    const payload = nodes
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((node) => {
        const position = workspaceNodePositionSchema.parse(node.position);
        return {
          workspaceId: node.workspaceId,
          appletId: node.appletId,
          id: node.nodeId,
          label: node.label,
          position,
          size: node.size,
        };
      });

    return workspaceNodesResponseSchema.parse(payload);
  },
});

export const createNode = mutation({
  args: {
    workspaceId: v.number(),
    nodeId: v.string(),
    appletId: v.string(),
    label: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
    size: v.object({
      width: v.number(),
      height: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const { workspaceId, nodeId, appletId, label, position, size } = args;
    workspaceIdSchema.parse(workspaceId);
    const normalizedPosition = workspaceNodePositionSchema.parse(position);
    workspaceNodeSchema.parse({
      workspaceId,
      appletId,
      id: nodeId,
      label,
      position: normalizedPosition,
      size,
    });

    const subject = await requireIdentitySubject(ctx);

    const result = await upsertWorkspaceNode(
      ctx,
      subject,
      workspaceId,
      nodeId,
      {
        appletId,
        label,
        position: normalizedPosition,
        size,
      },
    );

    return workspaceNodeSchema.parse(result);
  },
});

export const updateNode = mutation({
  args: {
    workspaceId: v.number(),
    nodeId: v.string(),
    position: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      }),
    ),
    size: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { workspaceId, nodeId, position, size } = args;
    workspaceIdSchema.parse(workspaceId);
    const subject = await requireIdentitySubject(ctx);

    const existing = await ctx.db
      .query("workspaceNodes")
      .withIndex("by_identitySubject_workspaceId_nodeId", (q) =>
        q
          .eq("identitySubject", subject)
          .eq("workspaceId", workspaceId)
          .eq("nodeId", nodeId),
      )
      .unique();

    if (!existing) {
      return null;
    }

    const nextPosition = workspaceNodePositionSchema.parse(
      position ?? existing.position,
    );
    const nextSize = size ?? existing.size;

    workspaceNodeSizeSchema.parse(nextSize);

    await ctx.db.patch(existing._id, {
      position: nextPosition,
      size: nextSize,
      updatedAt: Date.now(),
    });

    return workspaceNodeSchema.parse({
      workspaceId: existing.workspaceId,
      appletId: existing.appletId,
      id: nodeId,
      label: existing.label,
      position: nextPosition,
      size: nextSize,
    });
  },
});

export const removeNode = mutation({
  args: {
    workspaceId: v.number(),
    nodeId: v.string(),
  },
  handler: async (ctx, { workspaceId, nodeId }) => {
    workspaceIdSchema.parse(workspaceId);
    const subject = await requireIdentitySubject(ctx);

    const existing = await ctx.db
      .query("workspaceNodes")
      .withIndex("by_identitySubject_workspaceId_nodeId", (q) =>
        q
          .eq("identitySubject", subject)
          .eq("workspaceId", workspaceId)
          .eq("nodeId", nodeId),
      )
      .unique();

    if (!existing) {
      return { ok: false } as const;
    }

    await ctx.db.delete(existing._id);

    return { ok: true } as const;
  },
});

export const getViewport = query({
  args: {
    workspaceId: v.number(),
  },
  handler: async (ctx, args) => {
    const { workspaceId } = args;
    workspaceIdSchema.parse(workspaceId);
    const subject = await requireIdentitySubject(ctx);

    const existing = await ctx.db
      .query("workspaceViewports")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", workspaceId),
      )
      .unique();

    if (!existing) {
      return null;
    }

    return workspaceViewportSchema.parse({
      workspaceId: existing.workspaceId,
      position: existing.position,
      zoom: existing.zoom,
    });
  },
});

export const setViewport = mutation({
  args: {
    workspaceId: v.number(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    zoom: v.number(),
  },
  handler: async (ctx, args) => {
    const { workspaceId, position, zoom } = args;
    const payload = workspaceViewportSchema.parse({
      workspaceId,
      position,
      zoom,
    });

    const subject = await requireIdentitySubject(ctx);

    const existing = await ctx.db
      .query("workspaceViewports")
      .withIndex("by_identitySubject_workspaceId", (q) =>
        q.eq("identitySubject", subject).eq("workspaceId", payload.workspaceId),
      )
      .unique();

    const now = Date.now();

    if (!existing) {
      await ctx.db.insert("workspaceViewports", {
        identitySubject: subject,
        workspaceId: payload.workspaceId,
        position: payload.position,
        zoom: payload.zoom,
        updatedAt: now,
      });

      return payload;
    }

    await ctx.db.patch(existing._id, {
      position: payload.position,
      zoom: payload.zoom,
      updatedAt: now,
    });

    return payload;
  },
});
