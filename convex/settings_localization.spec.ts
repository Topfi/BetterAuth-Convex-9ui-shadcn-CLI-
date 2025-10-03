import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisteredMutation, RegisteredQuery } from "convex/server";

import { getPreferences, updatePreferences } from "./settings_localization";
import { defaultLocalizationSettings } from "../shared/settings/localization";
import { defaultThemeSettings } from "../shared/settings/theme";

type QueryArgs<Q> =
  Q extends RegisteredQuery<infer Args, unknown, unknown> ? Args : never;

type QueryResult<Q> =
  Q extends RegisteredQuery<unknown, infer Result, unknown> ? Result : never;

type MutationArgs<M> =
  M extends RegisteredMutation<unknown, infer Args, unknown> ? Args : never;

type MutationResult<M> =
  M extends RegisteredMutation<unknown, unknown, infer Result> ? Result : never;

type TestableQuery<Q> = Q & {
  _handler: (ctx: QueryCtx, args: QueryArgs<Q>) => Promise<QueryResult<Q>>;
};

type TestableMutation<M> = M & {
  _handler: (
    ctx: MutationCtx,
    args: MutationArgs<M>,
  ) => Promise<MutationResult<M>>;
};

type QueryCtx = {
  auth: {
    getUserIdentity: ReturnType<typeof vi.fn>;
  };
  db: {
    query: ReturnType<typeof createQueryMock>;
  };
};

type MutationCtx = QueryCtx & {
  db: ReturnType<typeof createMutationDbMock>;
};

const testableGetPreferences = getPreferences as TestableQuery<
  typeof getPreferences
>;
const testableUpdatePreferences = updatePreferences as TestableMutation<
  typeof updatePreferences
>;

const identitySpy = vi.fn();

beforeEach(() => {
  identitySpy.mockReset();
  identitySpy.mockResolvedValue({ subject: "user_1" });
});

describe("getPreferences", () => {
  it("returns default settings when no record exists", async () => {
    const ctx: QueryCtx = {
      auth: {
        getUserIdentity: identitySpy,
      },
      db: {
        query: createQueryMock({ first: null }),
      },
    };

    const result = await testableGetPreferences._handler(ctx, {});

    expect(result).toEqual(defaultLocalizationSettings);
    expect(identitySpy).toHaveBeenCalled();
  });

  it("returns default settings when localization is missing", async () => {
    const ctx: QueryCtx = {
      auth: {
        getUserIdentity: identitySpy,
      },
      db: {
        query: createQueryMock({ first: { localization: undefined } }),
      },
    };

    const result = await testableGetPreferences._handler(ctx, {});

    expect(result).toEqual(defaultLocalizationSettings);
  });

  it("returns persisted settings when available", async () => {
    const ctx: QueryCtx = {
      auth: {
        getUserIdentity: identitySpy,
      },
      db: {
        query: createQueryMock({
          first: {
            localization: {
              timeZone: "America/New_York",
              dateFormat: "iso8601",
              timeFormat: "twentyFourHour",
              showSeconds: false,
              language: "en",
            },
          },
        }),
      },
    };

    const result = await testableGetPreferences._handler(ctx, {});

    expect(result).toEqual({
      timeZone: "America/New_York",
      dateFormat: "iso8601",
      timeFormat: "twentyFourHour",
      showSeconds: false,
      language: "en",
    });
  });
});

describe("updatePreferences", () => {
  it("inserts new settings for first-time updates", async () => {
    const insertSpy = vi.fn().mockResolvedValue(undefined);
    const ctx: MutationCtx = {
      auth: {
        getUserIdentity: identitySpy,
      },
      db: createMutationDbMock({
        queryResult: { first: null },
        insert: insertSpy,
      }),
    };

    const next = {
      timeZone: "Europe/Berlin",
      dateFormat: "dayMonthYear" as const,
      timeFormat: "twentyFourHour" as const,
      showSeconds: false,
      language: "en" as const,
    };

    const result = await testableUpdatePreferences._handler(ctx, next);

    expect(result).toEqual(next);
    expect(insertSpy).toHaveBeenCalledWith(
      "userSettings",
      expect.objectContaining({
        identitySubject: "user_1",
        theme: defaultThemeSettings,
        localization: next,
      }),
    );
  });

  it("patches existing settings when a record exists", async () => {
    const patchSpy = vi.fn().mockResolvedValue(undefined);
    const ctx: MutationCtx = {
      auth: {
        getUserIdentity: identitySpy,
      },
      db: createMutationDbMock({
        queryResult: {
          first: {
            _id: "doc_123",
            localization: defaultLocalizationSettings,
          },
        },
        patch: patchSpy,
      }),
    };

    const next = {
      timeZone: "system" as const,
      dateFormat: "monthDayYear" as const,
      timeFormat: "twelveHour" as const,
      showSeconds: true,
      language: "en" as const,
    };

    const result = await testableUpdatePreferences._handler(ctx, next);

    expect(result).toEqual(next);
    expect(patchSpy).toHaveBeenCalledWith("doc_123", {
      localization: next,
      updatedAt: expect.any(Number),
    });
  });
});

function createQueryMock({ first }: { first: unknown }) {
  const withIndex = vi.fn(
    (_: string, callback: (q: { eq: typeof vi.fn }) => void) => {
      callback({ eq: vi.fn() });
      return {
        first: vi.fn(async () => first),
      };
    },
  );

  return vi.fn(() => ({ withIndex }));
}

function createMutationDbMock({
  queryResult,
  insert,
  patch,
}: {
  queryResult: { first: unknown };
  insert?: ReturnType<typeof vi.fn>;
  patch?: ReturnType<typeof vi.fn>;
}) {
  const query = createQueryMock(queryResult);
  return {
    query,
    insert: insert ?? vi.fn().mockResolvedValue(undefined),
    patch: patch ?? vi.fn().mockResolvedValue(undefined),
  };
}
