import { beforeAll, describe, expect, it, vi } from "vitest";

import { internal } from "./_generated/api";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import type { SecurityLogPayload } from "../shared/security";

type DispatcherFactory = (
  ctx: GenericCtx<DataModel>,
  optionsOnly: boolean,
) => (payload: SecurityLogPayload) => void;

let createDispatcher: DispatcherFactory;

beforeAll(async () => {
  process.env.SITE_URL ??= "http://localhost:5173";
  const mod = await import("./auth");
  createDispatcher =
    mod.__testCreateSecurityEventDispatcher as DispatcherFactory;
});

type TestCtx = GenericCtx<DataModel> & {
  scheduler?: {
    runAfter: ReturnType<typeof vi.fn>;
  };
  runMutation?: ReturnType<typeof vi.fn>;
};

describe("createSecurityEventDispatcher", () => {
  const payload = {
    event: "sign_in_success" as const,
    message: "Sign-in succeeded",
    path: "/sign-in",
    level: "info" as const,
    actorSubject: "user_123",
    ipAddress: "203.0.113.7",
    requestId: "req-123",
  };

  it("uses scheduler when available", () => {
    const runAfter = vi.fn().mockResolvedValue(undefined);
    const ctx: TestCtx = {
      scheduler: { runAfter },
    } as TestCtx;

    const dispatch = createDispatcher(ctx, false);

    dispatch(payload);

    expect(runAfter).toHaveBeenCalledTimes(1);
    expect(runAfter).toHaveBeenCalledWith(
      0,
      internal.auditLogs.recordSecurityEvent,
      payload,
    );
  });

  it("falls back to runMutation when scheduler missing", () => {
    const runMutation = vi.fn().mockResolvedValue(undefined);
    const ctx: TestCtx = {
      runMutation,
    } as TestCtx;

    const dispatch = createDispatcher(ctx, false);

    dispatch(payload);

    expect(runMutation).toHaveBeenCalledTimes(1);
    expect(runMutation).toHaveBeenCalledWith(
      internal.auditLogs.recordSecurityEvent,
      payload,
    );
  });

  it("does nothing when optionsOnly", () => {
    const runAfter = vi.fn();
    const runMutation = vi.fn();

    const ctx: TestCtx = {
      scheduler: { runAfter },
      runMutation,
    } as TestCtx;

    const dispatch = createDispatcher(ctx, true);

    dispatch(payload);

    expect(runAfter).not.toHaveBeenCalled();
    expect(runMutation).not.toHaveBeenCalled();
  });
});
