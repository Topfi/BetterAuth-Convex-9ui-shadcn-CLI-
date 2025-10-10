import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisteredMutation } from "convex/server";

import { rotatePassphrase } from "./settings_security";
import { PassphraseValidationError } from "../shared/passphrase-strength";

const { adapterUpdateSpy, adapterFactorySpy, getUserSpy } = vi.hoisted(() => {
  const adapterUpdateSpy = vi.fn();
  const adapterFactorySpy = vi.fn(() => ({
    findOne: vi.fn(),
    update: adapterUpdateSpy,
  }));
  const getUserSpy = vi.fn();
  return { adapterUpdateSpy, adapterFactorySpy, getUserSpy };
});

vi.mock("./auth", () => ({
  getAdapterWithUserOperations: adapterFactorySpy,
  getUser: getUserSpy,
}));

type MutationArgs<M> =
  M extends RegisteredMutation<unknown, infer Args, unknown> ? Args : never;

type MutationResult<M> =
  M extends RegisteredMutation<unknown, unknown, infer Result> ? Result : never;

type TestableMutation<M> = M & {
  _handler: (ctx: MockCtx, args: MutationArgs<M>) => Promise<MutationResult<M>>;
};

const rotatePassphraseMutation = rotatePassphrase as TestableMutation<
  typeof rotatePassphrase
>;

interface MockAuth {
  getUserIdentity: () => Promise<{
    subject: string;
    email?: string | null;
    name?: string | null;
  } | null>;
}

interface MockScheduler {
  runAfter: (delay: number, fn: unknown, args: Record<string, unknown>) => void;
}

interface MockCtx {
  auth: MockAuth;
  scheduler: MockScheduler;
}

describe("rotatePassphrase", () => {
  const getUserIdentitySpy = vi.fn();
  const runAfterSpy = vi.fn();

  const ctx: MockCtx = {
    auth: {
      getUserIdentity: getUserIdentitySpy,
    },
    scheduler: {
      runAfter: runAfterSpy,
    },
  };

  beforeEach(() => {
    adapterUpdateSpy.mockReset();
    adapterFactorySpy.mockClear();
    getUserSpy.mockReset();
    getUserIdentitySpy.mockReset();
    runAfterSpy.mockReset();

    getUserIdentitySpy.mockResolvedValue({
      subject: "user_1",
      email: "primary@example.com",
      name: "Primary User",
    });
    getUserSpy.mockResolvedValue({
      id: "user_1",
      email: "primary@example.com",
      name: "Primary User",
    });
  });

  it("rejects passphrases containing identity metadata and logs the rejection", async () => {
    await expect(
      rotatePassphraseMutation._handler(ctx, {
        passphrase: "primary@example.com-2025!",
      }),
    ).rejects.toBeInstanceOf(PassphraseValidationError);

    expect(adapterUpdateSpy).not.toHaveBeenCalled();
    expect(runAfterSpy).toHaveBeenCalledTimes(1);
    const [, , payload] = runAfterSpy.mock.calls[0];
    expect(payload).toMatchObject({
      event: "passphrase_rejected",
      level: "warn",
      path: "convex.settings_security.rotatePassphrase",
      details: {
        reason: "contains_metadata",
      },
    });
  });

  it("accepts strong passphrases and updates the Better Auth adapter", async () => {
    const result = await rotatePassphraseMutation._handler(ctx, {
      passphrase: "library-quiet-yellow-planet-92",
    });

    expect(result).toEqual({ ok: true });
    expect(adapterUpdateSpy).toHaveBeenCalledWith({
      model: "user",
      where: [{ field: "_id", operator: "eq", value: "user_1" }],
      update: expect.objectContaining({
        password: "library-quiet-yellow-planet-92",
      }),
    });
    expect(runAfterSpy).not.toHaveBeenCalled();
  });
});
