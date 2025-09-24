import type {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from "convex/server";
import { v } from "convex/values";

import { hashStringHex } from "./hash";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery } from "./_generated/server";

const fallbackKey = (hashedKey: string) => `rate-limit:${hashedKey}`;

const splitKey = (rawKey: string) => {
  const slashIndex = rawKey.indexOf("/");
  if (slashIndex === -1) {
    return {
      ip: rawKey,
      path: "/",
    };
  }

  const ip = rawKey.slice(0, slashIndex);
  const path = rawKey.slice(slashIndex) || "/";
  return { ip, path };
};

export const get = internalQuery({
  args: {
    key: v.string(),
  },
  handler: async (ctx, { key }) => {
    const results = await ctx.db
      .query("authRateLimits")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", key))
      .unique();

    if (!results) {
      return null;
    }

    return {
      key: results.keyHash,
      count: results.count,
      lastRequest: results.lastRequest,
    };
  },
});

export const upsert = internalMutation({
  args: {
    key: v.string(),
    path: v.string(),
    ipHash: v.string(),
    value: v.object({
      count: v.number(),
      lastRequest: v.number(),
    }),
    update: v.boolean(),
  },
  handler: async (ctx, { key, path, ipHash, value }) => {
    const existing = await ctx.db
      .query("authRateLimits")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", key))
      .unique();

    const payload = {
      path,
      ipHash,
      count: value.count,
      lastRequest: value.lastRequest,
      updatedAt: Date.now(),
    } as const;

    if (!existing) {
      await ctx.db.insert("authRateLimits", {
        keyHash: key,
        ...payload,
      });
      return;
    }

    await ctx.db.patch(existing._id, payload);
  },
});

type ConvexRunQuery = <
  Query extends FunctionReference<"query", "public" | "internal">,
>(
  query: Query,
  ...args: OptionalRestArgs<Query>
) => Promise<FunctionReturnType<Query>>;

type ConvexRunMutation = <
  Mutation extends FunctionReference<"mutation", "public" | "internal">,
>(
  mutation: Mutation,
  ...args: OptionalRestArgs<Mutation>
) => Promise<FunctionReturnType<Mutation>>;

type SecondaryStorage = {
  get?: (
    key: string,
  ) => Promise<string | undefined | null> | string | undefined | null;
  set?: (key: string, value: string) => Promise<void> | void;
};

type ConvexCtx = {
  runQuery: ConvexRunQuery;
  runMutation: ConvexRunMutation;
  options?: {
    secondaryStorage?: SecondaryStorage;
  };
};

type RateLimitRecord = {
  key: string;
  count: number;
  lastRequest: number;
};

export const createConvexRateLimitStorage = (ctx: ConvexCtx) => {
  return {
    async get(rawKey: string): Promise<RateLimitRecord | undefined> {
      const hashedKey = await hashStringHex(rawKey);
      try {
        const result = await ctx.runQuery(internal.rateLimitStorage.get, {
          key: hashedKey,
        });

        if (result) {
          return {
            key: result.key,
            count: result.count,
            lastRequest: result.lastRequest,
          } satisfies RateLimitRecord;
        }
      } catch (error) {
        const fallback = await ctx.options?.secondaryStorage?.get?.(
          fallbackKey(hashedKey),
        );
        if (fallback) {
          const parsed = JSON.parse(fallback) as {
            count: number;
            lastRequest: number;
          };
          return { key: hashedKey, ...parsed } satisfies RateLimitRecord;
        }
        throw error;
      }

      const fallback = await ctx.options?.secondaryStorage?.get?.(
        fallbackKey(hashedKey),
      );

      if (fallback) {
        const parsed = JSON.parse(fallback) as {
          count: number;
          lastRequest: number;
        };
        return { key: hashedKey, ...parsed } satisfies RateLimitRecord;
      }

      return undefined;
    },
    async set(
      rawKey: string,
      value: RateLimitRecord,
      update = false,
    ): Promise<void> {
      const hashedKey = await hashStringHex(rawKey);
      const { ip, path } = splitKey(rawKey);
      const ipHash = await hashStringHex(ip);

      try {
        await ctx.runMutation(internal.rateLimitStorage.upsert, {
          key: hashedKey,
          path,
          ipHash,
          value: {
            count: value.count,
            lastRequest: value.lastRequest,
          },
          update,
        });
      } catch {
        const serialized = JSON.stringify({
          count: value.count,
          lastRequest: value.lastRequest,
        });
        await ctx.options?.secondaryStorage?.set?.(
          fallbackKey(hashedKey),
          serialized,
        );
      }
    },
  };
};
