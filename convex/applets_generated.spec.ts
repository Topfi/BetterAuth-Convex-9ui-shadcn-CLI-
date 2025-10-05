import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisteredMutation } from "convex/server";

import type { Id } from "./_generated/dataModel";
import { commit, markFailed } from "./applets_generated";

function asId(value: string): Id<"generatedApplets"> {
  return value as Id<"generatedApplets">;
}

type MutationArgs<M> =
  M extends RegisteredMutation<unknown, infer Args, unknown> ? Args : never;

type MutationResult<M> =
  M extends RegisteredMutation<unknown, unknown, infer Result> ? Result : never;

type TestableInternalMutation<M> = M & {
  _handler: (
    ctx: CommitCtx,
    args: MutationArgs<M>,
  ) => Promise<MutationResult<M>>;
};

type CommitCtx = {
  db: {
    normalizeId: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
  };
  scheduler?: {
    runAfter: ReturnType<typeof vi.fn>;
  };
};

type TestableMutation<M> = M & {
  _handler: (
    ctx: FailureCtx,
    args: MutationArgs<M>,
  ) => Promise<MutationResult<M>>;
};

type FailureCtx = {
  auth: {
    getUserIdentity: ReturnType<typeof vi.fn>;
  };
  db: {
    normalizeId: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };
};

const commitMutation = commit as TestableInternalMutation<typeof commit>;
const markFailedMutation = markFailed as TestableMutation<typeof markFailed>;

const createCtx = ({
  doc,
}: {
  doc?: Partial<{
    _id: Id<"generatedApplets">;
    identitySubject: string;
  }>;
} = {}): CommitCtx => {
  const id = doc?._id ?? asId("gen_123");
  const normalizeId = vi.fn().mockReturnValue(id);
  const get = vi
    .fn()
    .mockResolvedValue({ _id: id, identitySubject: "user_1", ...doc });
  const patch = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn().mockResolvedValue(undefined);

  return {
    db: {
      normalizeId,
      get,
      patch,
      insert,
    },
  } as CommitCtx;
};

const createFailureCtx = (): FailureCtx => {
  const normalizeId = vi.fn().mockReturnValue(asId("gen_123"));
  const get = vi
    .fn()
    .mockResolvedValue({ _id: asId("gen_123"), identitySubject: "user_1" });
  const patch = vi.fn().mockResolvedValue(undefined);
  const getUserIdentity = vi.fn().mockResolvedValue({ subject: "user_1" });

  return {
    auth: {
      getUserIdentity,
    },
    db: {
      normalizeId,
      get,
      patch,
    },
  };
};

describe("commit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects when the entry file is missing", async () => {
    const ctx = createCtx({ doc: { _id: asId("gen_456") } });

    await expect(
      commitMutation._handler(ctx, {
        appletId: "gen_123",
        files: {
          "/components/Foo.tsx": "export const Foo = () => null;",
        },
        entry: "/App.tsx",
        meta: { name: "Test" },
      }),
    ).rejects.toThrowError("Entry file missing");

    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it("rejects disallowed file paths", async () => {
    const ctx = createCtx();

    await expect(
      commitMutation._handler(ctx, {
        appletId: "gen_123",
        files: {
          "/App.tsx": "export default () => null;",
          "/secret/.env": "TOKEN=1",
        },
        entry: "/App.tsx",
        meta: { name: "Test" },
      }),
    ).rejects.toThrowError("Disallowed file path");

    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it("persists files and logs when validation passes", async () => {
    const ctx = createCtx();

    await commitMutation._handler(ctx, {
      appletId: "gen_123",
      files: {
        "/App.tsx": "export default () => null;",
        "/components/Widget.tsx": "export const Widget = () => null;",
      },
      entry: "/App.tsx",
      meta: {
        name: "Generated",
        description: "demo",
      },
    });

    expect(ctx.db.patch).toHaveBeenCalledWith(
      asId("gen_123"),
      expect.objectContaining({
        name: "Generated",
        files: expect.any(Object),
        entry: "/App.tsx",
        status: "succeeded",
      }),
    );
    expect(ctx.db.insert).toHaveBeenCalledWith(
      "auditLogs",
      expect.objectContaining({
        event: "generated_applet_committed",
        path: "applets/generated",
      }),
    );
  });

  it("normalizes file and entry paths", async () => {
    const ctx = createCtx();

    await commitMutation._handler(ctx, {
      appletId: "gen_456",
      files: {
        "App.tsx": "export default () => null;",
        "components/Widget.tsx": "export const Widget = () => null;",
      },
      entry: "App.tsx",
      meta: { name: "Normalized" },
    });

    expect(ctx.db.patch).toHaveBeenCalledWith(
      asId("gen_456"),
      expect.objectContaining({
        files: expect.objectContaining({
          "/App.tsx": expect.any(String),
          "/components/Widget.tsx": expect.any(String),
        }),
        entry: "/App.tsx",
      }),
    );
  });
});

describe("markFailed", () => {
  it("updates the applet status with the failure reason", async () => {
    const ctx = createFailureCtx();

    await markFailedMutation._handler(ctx, {
      appletId: asId("gen_123"),
      error: "Missing API key",
    });

    expect(ctx.db.patch).toHaveBeenCalledWith(asId("gen_123"), {
      status: "failed",
      error: "Missing API key",
      updatedAt: expect.any(Number),
    });
  });
});
