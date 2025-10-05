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
});

export default schema;
