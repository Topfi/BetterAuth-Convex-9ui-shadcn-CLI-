import { z } from "zod";

export const workspaceIdSchema = z.number().int().min(1);

export const workspaceNameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Workspace name is required")
      .max(32, "Workspace name must be 32 characters or fewer")
      .regex(
        /^[A-Za-z0-9 ]+$/,
        "Workspace name can only include letters, numbers, and spaces",
      ),
  );

export const workspaceDefinitionSchema = z.object({
  id: workspaceIdSchema,
  name: workspaceNameSchema,
});

export const workspaceDefinitionsSchema = z.array(workspaceDefinitionSchema);

export type WorkspaceId = z.infer<typeof workspaceIdSchema>;
export type WorkspaceDefinition = z.infer<typeof workspaceDefinitionSchema>;

export const workspaceNodePositionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    z: z.number().default(0),
  })
  .transform((value) => ({
    ...value,
    z: value.z ?? 0,
  }));

export const workspaceNodeSizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const workspaceViewportPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const workspaceViewportSchema = z.object({
  workspaceId: workspaceIdSchema,
  position: workspaceViewportPositionSchema,
  zoom: z.number().positive(),
});

export const workspaceNodeSchema = z.object({
  workspaceId: workspaceIdSchema,
  appletId: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
  position: workspaceNodePositionSchema,
  size: workspaceNodeSizeSchema,
});

export const workspaceNodesResponseSchema = z.array(workspaceNodeSchema);

export type WorkspaceNodePosition = z.infer<typeof workspaceNodePositionSchema>;
export type WorkspaceViewportPosition = z.infer<
  typeof workspaceViewportPositionSchema
>;
export type WorkspaceNode = z.infer<typeof workspaceNodeSchema>;
export type WorkspaceViewport = z.infer<typeof workspaceViewportSchema>;
