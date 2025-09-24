import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisteredMutation } from "convex/server";

import { recordSecurityEvent } from "./auditLogs";

interface MockDb {
  insert: (table: "auditLogs", doc: Record<string, unknown>) => Promise<void>;
}

interface MockCtx {
  db: MockDb;
}

type MutationArgs<M> =
  M extends RegisteredMutation<unknown, infer Args, unknown> ? Args : never;

type TestableMutation<M> = M & {
  _handler: (ctx: MockCtx, args: MutationArgs<M>) => Promise<void>;
};

const recordSecurityEventMutation = recordSecurityEvent as TestableMutation<
  typeof recordSecurityEvent
>;

describe("recordSecurityEvent", () => {
  const insertSpy = vi.fn();

  const ctx: MockCtx = {
    db: {
      insert: insertSpy,
    },
  };

  beforeEach(() => {
    insertSpy.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  it("stores hashed IPs and structured payloads", async () => {
    await recordSecurityEventMutation._handler(ctx, {
      event: "sign_in_success",
      level: "info",
      message: "User signed in",
      path: "/sign-in/email",
      actorSubject: "user_123",
      ipAddress: "203.0.113.5",
      details: { method: "passphrase" },
      requestId: "req_1",
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const [table, doc] = insertSpy.mock.calls[0];
    expect(table).toBe("auditLogs");
    expect(doc).toMatchObject({
      event: "sign_in_success",
      level: "info",
      message: "User signed in",
      path: "/sign-in/email",
      actorSubject: "user_123",
      ipHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      requestId: "req_1",
      createdAt: Date.now(),
    });
    expect(doc).not.toHaveProperty("ipAddress");
    expect(doc.details).toEqual({ method: "passphrase" });
  });

  it("handles missing IP addresses without hashing failures", async () => {
    await recordSecurityEventMutation._handler(ctx, {
      event: "account_deleted",
      level: "warn",
      message: "Account deletion initiated",
      path: "/delete-user",
      details: { origin: "settings" },
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const [, doc] = insertSpy.mock.calls[0];
    expect(doc).toMatchObject({
      event: "account_deleted",
      level: "warn",
      message: "Account deletion initiated",
      path: "/delete-user",
      createdAt: Date.now(),
    });
    expect(doc.ipHash).toBeUndefined();
    expect(doc.actorSubject).toBeUndefined();
  });
});
