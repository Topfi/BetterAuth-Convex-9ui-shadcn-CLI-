import { hashStringHex } from "./hash";

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

import {
  securityEventSchema,
  securityLogLevelSchema,
  securityLogPayloadSchema,
  type SecurityLogPayload,
} from "../shared/security";

const normalizeDetails = (
  details: SecurityLogPayload["details"],
): Record<string, string> | undefined => {
  if (!details) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      typeof value === "string" ? value : String(value),
    ]),
  );
};

export const recordSecurityEvent = internalMutation({
  args: {
    event: v.string(),
    level: v.string(),
    message: v.string(),
    path: v.string(),
    actorSubject: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    details: v.optional(v.record(v.string(), v.string())),
    requestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parsed = securityLogPayloadSchema.parse(args);

    const ipHash = parsed.ipAddress
      ? await hashStringHex(parsed.ipAddress)
      : undefined;
    const normalized = normalizeDetails(parsed.details);

    const document = {
      event: securityEventSchema.parse(parsed.event),
      level: securityLogLevelSchema.parse(parsed.level),
      message: parsed.message,
      path: parsed.path,
      createdAt: Date.now(),
      ...(parsed.actorSubject ? { actorSubject: parsed.actorSubject } : {}),
      ...(ipHash ? { ipHash } : {}),
      ...(normalized ? { details: normalized } : {}),
      ...(parsed.requestId ? { requestId: parsed.requestId } : {}),
    } satisfies {
      event: SecurityLogPayload["event"];
      level: SecurityLogPayload["level"];
      message: string;
      path: string;
      createdAt: number;
      actorSubject?: string;
      ipHash?: string;
      details?: Record<string, string>;
      requestId?: string;
    };

    await ctx.db.insert("auditLogs", document);
  },
});
