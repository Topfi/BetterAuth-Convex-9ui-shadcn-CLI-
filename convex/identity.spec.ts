import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  autoclaimUsernameFromEmail,
  autoclaimUsernameFromSession,
  reserveUsername,
  stagePendingIdentity,
  updateUsername,
  finalizePendingIdentity,
  cleanupExpiredPendingIdentities,
  ensurePendingIdentityCleanupCron,
  cleanupExpiredUsernameHolds,
  ensureUsernameHoldCleanupCron,
} from "./identity";
import type { RegisteredMutation } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  AUTOCLAIM_FAILURE_MESSAGE,
  USERNAME_TAKEN_ERROR,
} from "../shared/identity";
import { USERNAME_HOLD_DURATION_MS } from "../shared/settings_profile/holds";

const {
  cleanupCronsGetMock,
  cleanupCronsRegisterMock,
  cleanupCronsDeleteMock,
  CronsMock,
} = vi.hoisted(() => {
  const get = vi.fn();
  const register = vi.fn();
  const del = vi.fn();
  const CronsMock = vi.fn().mockImplementation(() => ({
    get,
    register,
    delete: del,
  }));

  return {
    cleanupCronsGetMock: get,
    cleanupCronsRegisterMock: register,
    cleanupCronsDeleteMock: del,
    CronsMock,
  };
});

const { createFunctionHandleMock } = vi.hoisted(() => ({
  createFunctionHandleMock: vi.fn(),
}));

vi.mock("@convex-dev/crons", () => ({
  Crons: CronsMock,
}));

vi.mock("convex/server", async () => {
  const actual =
    await vi.importActual<typeof import("convex/server")>("convex/server");
  return {
    ...actual,
    createFunctionHandle: createFunctionHandleMock,
  };
});

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

vi.mock("./auth", () => ({
  getUser: getUserMock,
}));

type UserDocument = Doc<"users">;
type UserId = Id<"users">;
type PendingIdentityId = Id<"pendingIdentities">;
type PendingIdentityDocument = Doc<"pendingIdentities">;
type UsernameHoldId = Id<"usernameHolds">;
type UsernameHoldDocument = Doc<"usernameHolds">;

type Condition<T extends object> = (doc: T) => boolean;

interface MockQueryBuilder<T extends object> {
  eq: <K extends keyof T>(field: K, value: T[K]) => MockQueryBuilder<T>;
  lt: <K extends keyof T>(field: K, value: T[K]) => MockQueryBuilder<T>;
}

interface MockQueryResult<T> {
  unique: () => Promise<T | null>;
  first: () => Promise<T | null>;
  take: (limit: number) => Promise<T[]>;
}

type AnyDoc = UserDocument | PendingIdentityDocument | UsernameHoldDocument;

interface MockDb {
  query: (table: "users" | "pendingIdentities" | "usernameHolds") => {
    withIndex: (
      indexName: string,
      cb: (query: MockQueryBuilder<AnyDoc>) => void,
    ) => MockQueryResult<AnyDoc>;
  };
  insert: (
    table: "users" | "pendingIdentities" | "usernameHolds",
    doc:
      | Omit<UserDocument, "_id" | "_creationTime">
      | Omit<PendingIdentityDocument, "_id" | "_creationTime">
      | Omit<UsernameHoldDocument, "_id" | "_creationTime">,
  ) => Promise<UserId | PendingIdentityId | UsernameHoldId>;
  patch: (
    id: UserId | PendingIdentityId | UsernameHoldId,
    doc: Partial<UserDocument | PendingIdentityDocument | UsernameHoldDocument>,
  ) => Promise<void>;
  get: (
    id: UserId | PendingIdentityId | UsernameHoldId,
  ) => Promise<
    UserDocument | PendingIdentityDocument | UsernameHoldDocument | null
  >;
  delete: (id: UserId | PendingIdentityId | UsernameHoldId) => Promise<void>;
}

interface MockAuth {
  getUserIdentity: () => Promise<{ subject: string; email?: string } | null>;
}

interface MockMutationCtx {
  auth: MockAuth;
  db: MockDb;
}

type MutationArgs<M> =
  M extends RegisteredMutation<unknown, infer Args, unknown> ? Args : never;
type MutationResult<M> =
  M extends RegisteredMutation<unknown, unknown, infer Result> ? Result : never;
type TestableMutation<M> = M & {
  _handler: (ctx: MockMutationCtx, args: MutationArgs<M>) => MutationResult<M>;
};

const reserveUsernameMutation = reserveUsername as TestableMutation<
  typeof reserveUsername
>;
const autoclaimUsernameFromEmailMutation =
  autoclaimUsernameFromEmail as TestableMutation<
    typeof autoclaimUsernameFromEmail
  >;
const updateUsernameMutation = updateUsername as TestableMutation<
  typeof updateUsername
>;
const autoclaimUsernameFromSessionMutation =
  autoclaimUsernameFromSession as TestableMutation<
    typeof autoclaimUsernameFromSession
  >;
const stagePendingIdentityMutation = stagePendingIdentity as TestableMutation<
  typeof stagePendingIdentity
>;
const finalizePendingIdentityMutation =
  finalizePendingIdentity as TestableMutation<typeof finalizePendingIdentity>;
const cleanupExpiredPendingIdentitiesMutation =
  cleanupExpiredPendingIdentities as TestableMutation<
    typeof cleanupExpiredPendingIdentities
  >;
const ensurePendingIdentityCleanupCronMutation =
  ensurePendingIdentityCleanupCron as TestableMutation<
    typeof ensurePendingIdentityCleanupCron
  >;
const cleanupExpiredUsernameHoldsMutation =
  cleanupExpiredUsernameHolds as TestableMutation<
    typeof cleanupExpiredUsernameHolds
  >;
const ensureUsernameHoldCleanupCronMutation =
  ensureUsernameHoldCleanupCron as TestableMutation<
    typeof ensureUsernameHoldCleanupCron
  >;

interface MockEnvironment {
  ctx: MockMutationCtx;
  seedUser: (doc: UserDocument) => void;
  upsertPending: (doc: PendingIdentityDocument) => void;
  findUserBySubject: (subject: string) => UserDocument | undefined;
  findPendingByUserId: (
    betterAuthUserId: string,
  ) => PendingIdentityDocument | undefined;
  findPendingByEmailLower: (
    emailLower: string,
  ) => PendingIdentityDocument | undefined;
  upsertUsernameHold: (doc: UsernameHoldDocument) => void;
  findUsernameHoldByLower: (
    usernameLower: string,
  ) => UsernameHoldDocument | undefined;
  setIdentitySubject: (subject: string | null) => void;
  setIdentityEmail: (email: string | null) => void;
  getIdentitySubject: () => string | null;
  getIdentityEmail: () => string | null;
}

function createMockEnvironment(initialSubject: string | null): MockEnvironment {
  let identitySubject = initialSubject;
  let idCounter = 0;
  const users: UserDocument[] = [];
  const pendingIdentities: PendingIdentityDocument[] = [];
  const usernameHolds: UsernameHoldDocument[] = [];
  let identityEmail: string | null = null;

  const createQueryBuilder = <T extends object>() => {
    const predicates: Condition<T>[] = [];
    const builder: MockQueryBuilder<T> = {
      eq: (field, value) => {
        predicates.push((doc) => doc[field] === value);
        return builder;
      },
      lt: (field, value) => {
        predicates.push((doc) => {
          const left = doc[field];
          if (typeof left === "number" && typeof value === "number") {
            return left < value;
          }
          return false;
        });
        return builder;
      },
    };
    return { builder, predicates };
  };

  const filterDocuments = <T extends object>(
    docs: T[],
    predicates: Condition<T>[],
  ) => docs.filter((doc) => predicates.every((predicate) => predicate(doc)));

  const ctx: MockMutationCtx = {
    auth: {
      getUserIdentity: async () =>
        identitySubject
          ? identityEmail
            ? { subject: identitySubject, email: identityEmail }
            : { subject: identitySubject }
          : null,
    },
    db: {
      query: (table) => {
        if (table === "users") {
          return {
            withIndex: (_indexName, cb) => {
              const { builder, predicates } =
                createQueryBuilder<UserDocument>();
              cb(builder as unknown as MockQueryBuilder<AnyDoc>);
              const results = filterDocuments(users, predicates);
              const first: UserDocument | undefined = results[0];
              return {
                unique: async () => first ?? null,
                first: async () => first ?? null,
                take: async (limit) => results.slice(0, limit),
              } satisfies MockQueryResult<AnyDoc>;
            },
          };
        }

        if (table === "pendingIdentities") {
          return {
            withIndex: (indexName, cb) => {
              const { builder, predicates } =
                createQueryBuilder<PendingIdentityDocument>();
              cb(builder as unknown as MockQueryBuilder<AnyDoc>);
              const results = filterDocuments(pendingIdentities, predicates);
              if (indexName === "by_expiresAt") {
                results.sort((a, b) => a.expiresAt - b.expiresAt);
              }
              const first: PendingIdentityDocument | undefined = results[0];
              return {
                unique: async () => first ?? null,
                first: async () => first ?? null,
                take: async (limit) => results.slice(0, limit),
              } satisfies MockQueryResult<AnyDoc>;
            },
          };
        }

        if (table === "usernameHolds") {
          return {
            withIndex: (indexName, cb) => {
              const { builder, predicates } =
                createQueryBuilder<UsernameHoldDocument>();
              cb(builder as unknown as MockQueryBuilder<AnyDoc>);
              const results = filterDocuments(usernameHolds, predicates);
              if (indexName === "by_releaseAt") {
                results.sort((a, b) => a.releaseAt - b.releaseAt);
              }
              const first: UsernameHoldDocument | undefined = results[0];
              return {
                unique: async () => first ?? null,
                first: async () => first ?? null,
                take: async (limit) => results.slice(0, limit),
              } satisfies MockQueryResult<AnyDoc>;
            },
          };
        }

        throw new Error(`Unsupported table ${table}`);
      },
      insert: async (table, doc) => {
        idCounter += 1;
        if (table === "users") {
          const id = `user_${idCounter}` as UserId;
          users.push({
            _id: id,
            _creationTime: idCounter,
            ...(doc as Omit<UserDocument, "_id" | "_creationTime">),
          });
          return id;
        }

        if (table === "pendingIdentities") {
          const id = `pending_${idCounter}` as PendingIdentityId;
          pendingIdentities.push({
            _id: id,
            _creationTime: idCounter,
            ...(doc as Omit<PendingIdentityDocument, "_id" | "_creationTime">),
          });
          return id;
        }

        const id = `hold_${idCounter}` as UsernameHoldId;
        usernameHolds.push({
          _id: id,
          _creationTime: idCounter,
          ...(doc as Omit<UsernameHoldDocument, "_id" | "_creationTime">),
        });
        return id;
      },
      patch: async (id, doc) => {
        if (String(id).startsWith("pending_")) {
          const existingIndex = pendingIdentities.findIndex(
            (entry) => entry._id === (id as PendingIdentityId),
          );
          if (existingIndex === -1) {
            throw new Error(`Pending identity ${id} not found`);
          }
          pendingIdentities[existingIndex] = {
            ...pendingIdentities[existingIndex]!,
            ...(doc as Partial<PendingIdentityDocument>),
          } satisfies PendingIdentityDocument;
          return;
        }

        if (String(id).startsWith("hold_")) {
          const existingIndex = usernameHolds.findIndex(
            (entry) => entry._id === (id as UsernameHoldId),
          );
          if (existingIndex === -1) {
            throw new Error(`Username hold ${id} not found`);
          }
          usernameHolds[existingIndex] = {
            ...usernameHolds[existingIndex]!,
            ...(doc as Partial<UsernameHoldDocument>),
          } satisfies UsernameHoldDocument;
          return;
        }

        const existingIndex = users.findIndex(
          (user) => user._id === (id as UserId),
        );
        if (existingIndex === -1) {
          throw new Error(`User ${id} not found`);
        }
        users[existingIndex] = {
          ...users[existingIndex]!,
          ...(doc as Partial<UserDocument>),
        } satisfies UserDocument;
      },
      get: async (id) => {
        if (String(id).startsWith("pending_")) {
          return (
            pendingIdentities.find(
              (entry) => entry._id === (id as PendingIdentityId),
            ) ?? null
          );
        }
        if (String(id).startsWith("hold_")) {
          return (
            usernameHolds.find(
              (entry) => entry._id === (id as UsernameHoldId),
            ) ?? null
          );
        }
        return users.find((user) => user._id === (id as UserId)) ?? null;
      },
      delete: async (id) => {
        if (String(id).startsWith("pending_")) {
          const index = pendingIdentities.findIndex(
            (entry) => entry._id === (id as PendingIdentityId),
          );
          if (index !== -1) {
            pendingIdentities.splice(index, 1);
          }
          return;
        }

        if (String(id).startsWith("hold_")) {
          const index = usernameHolds.findIndex(
            (entry) => entry._id === (id as UsernameHoldId),
          );
          if (index !== -1) {
            usernameHolds.splice(index, 1);
          }
          return;
        }

        const index = users.findIndex((user) => user._id === (id as UserId));
        if (index !== -1) {
          users.splice(index, 1);
        }
      },
    },
  } satisfies MockMutationCtx;

  const seedUser = (doc: UserDocument) => {
    const index = users.findIndex((user) => user._id === doc._id);
    if (index === -1) {
      users.push(doc);
    } else {
      users[index] = doc;
    }
  };

  const upsertPending = (doc: PendingIdentityDocument) => {
    const index = pendingIdentities.findIndex((entry) => entry._id === doc._id);
    if (index === -1) {
      pendingIdentities.push(doc);
    } else {
      pendingIdentities[index] = doc;
    }
  };

  const upsertUsernameHold = (doc: UsernameHoldDocument) => {
    const index = usernameHolds.findIndex((entry) => entry._id === doc._id);
    if (index === -1) {
      usernameHolds.push(doc);
    } else {
      usernameHolds[index] = doc;
    }
  };

  const findUserBySubject = (subject: string) =>
    users.find((user) => user.identitySubject === subject);

  const findUsernameHoldByLower = (usernameLower: string) =>
    usernameHolds.find((entry) => entry.usernameLower === usernameLower);

  const findPendingByUserId = (betterAuthUserId: string) =>
    pendingIdentities.find(
      (entry) => entry.betterAuthUserId === betterAuthUserId,
    );

  const findPendingByEmailLower = (emailLower: string) =>
    pendingIdentities.find((entry) => entry.emailLower === emailLower);

  const setIdentitySubject = (subject: string | null) => {
    identitySubject = subject;
  };

  const setIdentityEmail = (email: string | null) => {
    identityEmail = email;
  };

  return {
    ctx,
    seedUser,
    upsertPending,
    upsertUsernameHold,
    findUserBySubject,
    findPendingByUserId,
    findPendingByEmailLower,
    findUsernameHoldByLower,
    setIdentitySubject,
    setIdentityEmail,
    getIdentitySubject: () => identitySubject,
    getIdentityEmail: () => identityEmail,
  } satisfies MockEnvironment;
}

describe("convex identity mutations", () => {
  let env: MockEnvironment;

  beforeEach(() => {
    env = createMockEnvironment("user_current");
    cleanupCronsGetMock.mockReset();
    cleanupCronsRegisterMock.mockReset();
    cleanupCronsDeleteMock.mockReset();
    CronsMock.mockClear();
    createFunctionHandleMock.mockReset();
    createFunctionHandleMock.mockResolvedValue("identity-cleanup-handle");
    cleanupCronsGetMock.mockResolvedValue(null);
    getUserMock.mockReset();
    getUserMock.mockImplementation(async () => {
      const subject = env.getIdentitySubject();
      if (!subject) {
        return null;
      }
      const email = env.getIdentityEmail();
      return email ? { subject, email } : { subject };
    });
  });

  it("stages a pending identity with 24 hour expiry and prevents collisions", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      await stagePendingIdentityMutation._handler(env.ctx, {
        betterAuthUserId: "pending_user",
        email: "PendingUser@example.com",
        username: "PendingUser",
        imageBase64: "data:image/png;base64,hello",
      });

      const stored = env.findPendingByUserId("pending_user");
      expect(stored).toBeTruthy();
      expect(stored?.email).toBe("PendingUser@example.com");
      expect(stored?.emailLower).toBe("pendinguser@example.com");
      expect(stored?.usernameLower).toBe("pendinguser");
      expect(stored?.usernameDisplay).toBe("PendingUser");
      expect(stored?.imageBase64).toBe("data:image/png;base64,hello");
      expect(stored?.expiresAt).toBe(Date.now() + 24 * 60 * 60 * 1000);

      await expect(
        stagePendingIdentityMutation._handler(env.ctx, {
          betterAuthUserId: "another_user",
          email: "other@example.com",
          username: "PendingUser",
          imageBase64: undefined,
        }),
      ).rejects.toThrowError(USERNAME_TAKEN_ERROR);

      await stagePendingIdentityMutation._handler(env.ctx, {
        betterAuthUserId: "pending_user",
        email: "PendingUser@example.com",
        username: "PendingUserUpdated",
        imageBase64: undefined,
      });

      const updated = env.findPendingByUserId("pending_user");
      expect(updated?.usernameDisplay).toBe("PendingUserUpdated");
    } finally {
      vi.useRealTimers();
    }
  });

  it("finalizes staged identities and removes pending records", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      await stagePendingIdentityMutation._handler(env.ctx, {
        betterAuthUserId: "pending_user",
        email: "PendingUser@example.com",
        username: "PendingUser",
        imageBase64: undefined,
      });

      const result = await finalizePendingIdentityMutation._handler(env.ctx, {
        betterAuthUserId: "pending_user",
        email: "PendingUser@example.com",
        name: "Pending User",
        imageUrl: "https://example.com/avatar.png",
      });

      expect(result).toEqual({
        ok: true,
        username: { lower: "pendinguser", display: "PendingUser" },
      });

      const created = env.findUserBySubject("pending_user");
      expect(created?.usernameLower).toBe("pendinguser");
      expect(created?.usernameDisplay).toBe("PendingUser");
      expect(env.findPendingByUserId("pending_user")).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("finalization falls back to Better Auth details when no staging entry exists", async () => {
    const result = await finalizePendingIdentityMutation._handler(env.ctx, {
      betterAuthUserId: "fresh_subject",
      email: "fresh@example.com",
      name: "Friendly Name",
      imageUrl: undefined,
    });

    expect(result).toEqual({
      ok: true,
      username: { lower: "friendlyname", display: "FriendlyName" },
    });

    const stored = env.findUserBySubject("fresh_subject");
    expect(stored?.usernameLower).toBe("friendlyname");
  });

  it("cleans up expired pending identities", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-02T00:00:00Z"));
      env.upsertPending({
        _id: "pending_legacy" as PendingIdentityId,
        _creationTime: Date.now() - 48 * 60 * 60 * 1000,
        betterAuthUserId: "pending_user",
        email: "old@example.com",
        emailLower: "old@example.com",
        usernameLower: "olduser",
        usernameDisplay: "OldUser",
        imageBase64: undefined,
        expiresAt: Date.now() - 60 * 60 * 1000,
        createdAt: Date.now() - 48 * 60 * 60 * 1000,
      } satisfies PendingIdentityDocument);

      await cleanupExpiredPendingIdentitiesMutation._handler(env.ctx, {});

      expect(env.findPendingByUserId("pending_user")).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("registers the pending identity cleanup cron when missing", async () => {
    cleanupCronsRegisterMock.mockResolvedValueOnce("cron-id");

    const result = await ensurePendingIdentityCleanupCronMutation._handler(
      env.ctx,
      {},
    );

    expect(cleanupCronsGetMock).toHaveBeenCalledWith(env.ctx, {
      name: "identityPendingCleanupHourly",
    });
    expect(cleanupCronsDeleteMock).not.toHaveBeenCalled();
    expect(cleanupCronsRegisterMock).toHaveBeenCalledWith(
      env.ctx,
      { kind: "interval", ms: 24 * 60 * 60 * 1000 },
      internal.identity.cleanupExpiredPendingIdentities,
      {},
      "identityPendingCleanupHourly",
    );
    expect(result).toEqual({ ok: true, created: true, id: "cron-id" });
  });

  it("keeps the existing cleanup cron when configuration matches", async () => {
    cleanupCronsGetMock.mockResolvedValueOnce({
      id: "cron-id",
      name: "identityPendingCleanupHourly",
      functionHandle: "identity-cleanup-handle",
      args: {},
      schedule: { kind: "interval", ms: 24 * 60 * 60 * 1000 },
    });

    const result = await ensurePendingIdentityCleanupCronMutation._handler(
      env.ctx,
      {},
    );

    expect(cleanupCronsDeleteMock).not.toHaveBeenCalled();
    expect(cleanupCronsRegisterMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, created: false, id: "cron-id" });
  });

  it("recreates the cleanup cron when schedule drift is detected", async () => {
    cleanupCronsGetMock.mockResolvedValueOnce({
      id: "cron-id",
      name: "identityPendingCleanupHourly",
      functionHandle: "identity-cleanup-handle",
      args: {},
      schedule: { kind: "interval", ms: 30 * 60 * 1000 },
    });
    cleanupCronsRegisterMock.mockResolvedValueOnce("cron-fix");

    const result = await ensurePendingIdentityCleanupCronMutation._handler(
      env.ctx,
      {},
    );

    expect(cleanupCronsDeleteMock).toHaveBeenCalledWith(env.ctx, {
      name: "identityPendingCleanupHourly",
    });
    expect(cleanupCronsRegisterMock).toHaveBeenCalledWith(
      env.ctx,
      { kind: "interval", ms: 24 * 60 * 60 * 1000 },
      internal.identity.cleanupExpiredPendingIdentities,
      {},
      "identityPendingCleanupHourly",
    );
    expect(result).toEqual({ ok: true, created: true, id: "cron-fix" });
  });

  it("registers the username hold cleanup cron when missing", async () => {
    cleanupCronsRegisterMock.mockResolvedValueOnce("hold-cron-id");
    createFunctionHandleMock.mockResolvedValueOnce("hold-cleanup-handle");

    const result = await ensureUsernameHoldCleanupCronMutation._handler(
      env.ctx,
      {},
    );

    expect(cleanupCronsGetMock).toHaveBeenCalledWith(env.ctx, {
      name: "identityUsernameHoldCleanupHourly",
    });
    expect(cleanupCronsRegisterMock).toHaveBeenCalledWith(
      env.ctx,
      { kind: "cron", cronspec: "0 * * * *" },
      internal.identity.cleanupExpiredUsernameHolds,
      {},
      "identityUsernameHoldCleanupHourly",
    );
    expect(result).toEqual({ ok: true, created: true, id: "hold-cron-id" });
  });

  it("keeps the username hold cleanup cron when configuration matches", async () => {
    cleanupCronsGetMock.mockResolvedValueOnce({
      id: "hold-cron-id",
      name: "identityUsernameHoldCleanupHourly",
      functionHandle: "hold-cleanup-handle",
      args: {},
      schedule: { kind: "cron", cronspec: "0 * * * *" },
    });
    createFunctionHandleMock.mockResolvedValueOnce("hold-cleanup-handle");

    const result = await ensureUsernameHoldCleanupCronMutation._handler(
      env.ctx,
      {},
    );

    expect(cleanupCronsDeleteMock).not.toHaveBeenCalled();
    expect(cleanupCronsRegisterMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, created: false, id: "hold-cron-id" });
  });

  it("recreates the username hold cleanup cron when schedule drift is detected", async () => {
    cleanupCronsGetMock.mockResolvedValueOnce({
      id: "hold-cron-id",
      name: "identityUsernameHoldCleanupHourly",
      functionHandle: "hold-cleanup-handle",
      args: {},
      schedule: { kind: "cron", cronspec: "15 * * * *" },
    });
    cleanupCronsRegisterMock.mockResolvedValueOnce("hold-cron-fix");
    createFunctionHandleMock.mockResolvedValueOnce("hold-cleanup-handle-new");

    const result = await ensureUsernameHoldCleanupCronMutation._handler(
      env.ctx,
      {},
    );

    expect(cleanupCronsDeleteMock).toHaveBeenCalledWith(env.ctx, {
      name: "identityUsernameHoldCleanupHourly",
    });
    expect(cleanupCronsRegisterMock).toHaveBeenCalledWith(
      env.ctx,
      { kind: "cron", cronspec: "0 * * * *" },
      internal.identity.cleanupExpiredUsernameHolds,
      {},
      "identityUsernameHoldCleanupHourly",
    );
    expect(result).toEqual({ ok: true, created: true, id: "hold-cron-fix" });
  });

  it("autoclaims a username when the base is available", async () => {
    env.setIdentityEmail("FreshUser@example.com");

    const result = await autoclaimUsernameFromSessionMutation._handler(
      env.ctx,
      {},
    );

    const created = env.findUserBySubject("user_current");
    expect(result).toEqual({
      ok: true,
      username: { lower: "freshuser", display: "FreshUser" },
    });
    expect(created?.usernameLower).toBe("freshuser");
    expect(created?.usernameDisplay).toBe("FreshUser");
  });

  it("rejects username reservation collisions", async () => {
    env.seedUser({
      _id: "user_existing" as UserId,
      _creationTime: 0,
      identitySubject: "other_user",
      usernameLower: "alex",
      usernameDisplay: "Alex",
    });

    await expect(
      reserveUsernameMutation._handler(env.ctx, { display: "Alex" }),
    ).rejects.toThrowError(USERNAME_TAKEN_ERROR);
  });

  it("autoclaims usernames with numeric suffix when needed", async () => {
    env.seedUser({
      _id: "user_existing" as UserId,
      _creationTime: 0,
      identitySubject: "other_user",
      usernameLower: "alex",
      usernameDisplay: "Alex",
    });

    const result = await autoclaimUsernameFromEmailMutation._handler(env.ctx, {
      email: "Alex@example.com",
    });

    const created = env.findUserBySubject("user_current");

    expect(result).toEqual({
      ok: true,
      username: { lower: "alex1", display: "Alex1" },
    });
    expect(created?.usernameLower).toBe("alex1");
    expect(created?.usernameDisplay).toBe("Alex1");
  });

  it("autoclaims usernames with incremental suffixes when session base collides", async () => {
    env.seedUser({
      _id: "user_existing" as UserId,
      _creationTime: 0,
      identitySubject: "first_user",
      usernameLower: "alex",
      usernameDisplay: "Alex",
    });
    env.seedUser({
      _id: "user_existing_1" as UserId,
      _creationTime: 1,
      identitySubject: "second_user",
      usernameLower: "alex1",
      usernameDisplay: "Alex1",
    });
    env.setIdentityEmail("Alex@example.com");

    const result = await autoclaimUsernameFromSessionMutation._handler(
      env.ctx,
      {},
    );

    const created = env.findUserBySubject("user_current");
    expect(result).toEqual({
      ok: true,
      username: { lower: "alex2", display: "Alex2" },
    });
    expect(created?.usernameLower).toBe("alex2");
    expect(created?.usernameDisplay).toBe("Alex2");
  });

  it("is idempotent when the subject already has a username", async () => {
    env.setIdentityEmail("RepeatUser@example.com");

    const first = await autoclaimUsernameFromSessionMutation._handler(
      env.ctx,
      {},
    );
    const second = await autoclaimUsernameFromSessionMutation._handler(
      env.ctx,
      {},
    );

    expect(first).toEqual({
      ok: true,
      username: { lower: "repeatuser", display: "RepeatUser" },
    });
    expect(second).toEqual(first);
  });

  it("allows users to update to their existing username", async () => {
    env.seedUser({
      _id: "user_current_doc" as UserId,
      _creationTime: 0,
      identitySubject: "user_current",
      usernameLower: "delta",
      usernameDisplay: "Delta",
    });

    const result = await updateUsernameMutation._handler(env.ctx, {
      display: "DELTA",
    });

    const updated = env.findUserBySubject("user_current");
    expect(result).toEqual({ ok: true });
    expect(updated?.usernameLower).toBe("delta");
    expect(updated?.usernameDisplay).toBe("DELTA");
  });

  it("creates a username hold when renaming", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      env.seedUser({
        _id: "user_current_doc" as UserId,
        _creationTime: 0,
        identitySubject: "user_current",
        usernameLower: "delta",
        usernameDisplay: "Delta",
      });

      const result = await updateUsernameMutation._handler(env.ctx, {
        display: "Omega",
      });

      expect(result).toEqual({ ok: true });
      const hold = env.findUsernameHoldByLower("delta");
      expect(hold).toBeTruthy();
      expect(hold?.identitySubject).toBe("user_current");
      expect(hold?.usernameDisplay).toBe("Delta");
      expect(hold?.releaseAt).toBe(Date.now() + USERNAME_HOLD_DURATION_MS);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects username updates when the target username is on hold", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      env.seedUser({
        _id: "user_current_doc" as UserId,
        _creationTime: 0,
        identitySubject: "user_current",
        usernameLower: "alpha",
        usernameDisplay: "Alpha",
      });

      await updateUsernameMutation._handler(env.ctx, {
        display: "Bravo",
      });

      env.seedUser({
        _id: "user_second_doc" as UserId,
        _creationTime: 1,
        identitySubject: "user_second",
        usernameLower: "second",
        usernameDisplay: "Second",
      });
      env.setIdentitySubject("user_second");

      await expect(
        updateUsernameMutation._handler(env.ctx, { display: "Alpha" }),
      ).rejects.toThrow(USERNAME_TAKEN_ERROR);
    } finally {
      env.setIdentitySubject("user_current");
      vi.useRealTimers();
    }
  });

  it("autoclaims username from current session email", async () => {
    env.setIdentityEmail("NewUser@example.com");

    const result = await autoclaimUsernameFromSessionMutation._handler(
      env.ctx,
      {},
    );

    const created = env.findUserBySubject("user_current");
    expect(result).toEqual({
      ok: true,
      username: { lower: "newuser", display: "NewUser" },
    });
    expect(created?.usernameLower).toBe("newuser");
    expect(created?.usernameDisplay).toBe("NewUser");
  });

  it("prefers staged usernames when autoclaiming from the session", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      await stagePendingIdentityMutation._handler(env.ctx, {
        betterAuthUserId: "user_current",
        email: "PendingUser@example.com",
        username: "PendingUser",
        imageBase64: undefined,
      });

      env.setIdentityEmail("fallback@example.com");

      const result = await autoclaimUsernameFromSessionMutation._handler(
        env.ctx,
        {},
      );

      expect(result).toEqual({
        ok: true,
        username: { lower: "pendinguser", display: "PendingUser" },
      });
      const created = env.findUserBySubject("user_current");
      expect(created?.usernameLower).toBe("pendinguser");
    } finally {
      vi.useRealTimers();
    }
  });

  it("removes expired username holds during cleanup", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      env.upsertUsernameHold({
        _id: "hold_expired" as UsernameHoldId,
        _creationTime: Date.now() - 10,
        identitySubject: "user_current",
        usernameLower: "stale",
        usernameDisplay: "Stale",
        releaseAt: Date.now() - 1000,
        createdAt: Date.now() - 10,
      } satisfies UsernameHoldDocument);

      await cleanupExpiredUsernameHoldsMutation._handler(env.ctx, {});

      expect(env.findUsernameHoldByLower("stale")).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to manual pick when no email available", async () => {
    env.setIdentityEmail(null);

    const result = await autoclaimUsernameFromSessionMutation._handler(
      env.ctx,
      {},
    );

    expect(result).toEqual({
      ok: false,
      reason: "no_email",
      message: AUTOCLAIM_FAILURE_MESSAGE,
    });
  });

  it("returns not_authenticated when there is no session", async () => {
    env.setIdentitySubject(null);
    env.setIdentityEmail(null);

    const result = await autoclaimUsernameFromSessionMutation._handler(
      env.ctx,
      {},
    );

    expect(result).toEqual({
      ok: false,
      reason: "not_authenticated",
      message: AUTOCLAIM_FAILURE_MESSAGE,
    });
  });
});
