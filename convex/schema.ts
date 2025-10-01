import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  counters: defineTable({
    userId: v.string(),
    value: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
  users: defineTable({
    identitySubject: v.string(),
    usernameLower: v.string(),
    usernameDisplay: v.string(),
  })
    .index("by_identitySubject", ["identitySubject"])
    .index("by_usernameLower", ["usernameLower"]),
  pendingIdentities: defineTable({
    betterAuthUserId: v.string(),
    email: v.string(),
    emailLower: v.string(),
    usernameLower: v.string(),
    usernameDisplay: v.string(),
    imageBase64: v.optional(v.string()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_betterAuthUserId", ["betterAuthUserId"])
    .index("by_usernameLower", ["usernameLower"])
    .index("by_emailLower", ["emailLower"])
    .index("by_expiresAt", ["expiresAt"]),
  usernameHolds: defineTable({
    identitySubject: v.string(),
    usernameLower: v.string(),
    usernameDisplay: v.string(),
    releaseAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_usernameLower", ["usernameLower"])
    .index("by_releaseAt", ["releaseAt"])
    .index("by_identitySubject", ["identitySubject"]),
  auditLogs: defineTable({
    event: v.string(),
    level: v.string(),
    message: v.string(),
    path: v.string(),
    actorSubject: v.optional(v.string()),
    ipHash: v.optional(v.string()),
    details: v.optional(v.record(v.string(), v.string())),
    requestId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actorSubject", ["actorSubject"])
    .index("by_createdAt", ["createdAt"]),
  authRateLimits: defineTable({
    keyHash: v.string(),
    ipHash: v.string(),
    path: v.string(),
    count: v.number(),
    lastRequest: v.number(),
    updatedAt: v.number(),
  })
    .index("by_keyHash", ["keyHash"])
    .index("by_ipHash", ["ipHash"]),
  workspaces: defineTable({
    identitySubject: v.string(),
    workspaceId: v.number(),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_identitySubject", ["identitySubject"])
    .index("by_identitySubject_workspaceId", ["identitySubject", "workspaceId"])
    .index("by_identitySubject_name", ["identitySubject", "name"]),
  workspaceNodes: defineTable({
    identitySubject: v.string(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_identitySubject_workspaceId", ["identitySubject", "workspaceId"])
    .index("by_identitySubject_workspaceId_nodeId", [
      "identitySubject",
      "workspaceId",
      "nodeId",
    ]),
  workspaceViewports: defineTable({
    identitySubject: v.string(),
    workspaceId: v.number(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    zoom: v.number(),
    updatedAt: v.number(),
  }).index("by_identitySubject_workspaceId", [
    "identitySubject",
    "workspaceId",
  ]),
  userSettings: defineTable({
    identitySubject: v.string(),
    theme: v.object({
      mode: v.union(v.literal("light"), v.literal("dark")),
      backgroundPattern: v.union(
        v.literal("cross"),
        v.literal("dots"),
        v.literal("lines"),
        v.literal("none"),
      ),
    }),
    updatedAt: v.number(),
  }).index("by_identitySubject", ["identitySubject"]),
});

export default schema;
