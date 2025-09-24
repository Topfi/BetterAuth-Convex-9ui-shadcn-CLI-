import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createConvexRateLimitStorage } from "./rateLimitStorage";

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
const hashIp = (ip: string) => createHash("sha256").update(ip).digest("hex");

function splitKey(raw: string) {
  const slashIndex = raw.indexOf("/");
  const ip = slashIndex > -1 ? raw.slice(0, slashIndex) : raw;
  const path = slashIndex > -1 ? raw.slice(slashIndex) || "/" : "/";
  return { ip, path };
}

describe("createConvexRateLimitStorage", () => {
  type RateLimitStorageCtx = Parameters<typeof createConvexRateLimitStorage>[0];

  const runQueryMock = vi.fn();
  const runMutationMock = vi.fn();
  const secondaryStorageGetMock = vi.fn();
  const secondaryStorageSetMock = vi.fn();

  const runQuery: RateLimitStorageCtx["runQuery"] = (...args) =>
    runQueryMock(...args);
  const runMutation: RateLimitStorageCtx["runMutation"] = (...args) =>
    runMutationMock(...args);

  const ctx: RateLimitStorageCtx = {
    runQuery,
    runMutation,
    options: {
      secondaryStorage: {
        get: secondaryStorageGetMock,
        set: secondaryStorageSetMock,
      },
    },
  };

  beforeEach(() => {
    runQueryMock.mockReset();
    runMutationMock.mockReset();
    secondaryStorageGetMock.mockReset();
    secondaryStorageSetMock.mockReset();
  });

  it("persists new rate limit entries and reads them back", async () => {
    runMutationMock.mockResolvedValueOnce(null);

    const storage = createConvexRateLimitStorage(ctx);
    const rawKey = "203.0.113.5/sign-in/email";
    await storage.set(rawKey, {
      key: rawKey,
      count: 1,
      lastRequest: 1_000,
    });

    const expectedKey = hashKey(rawKey);
    const { ip, path } = splitKey(rawKey);
    expect(runMutationMock).toHaveBeenCalledWith(expect.anything(), {
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      value: {
        count: 1,
        lastRequest: 1_000,
      },
      update: false,
    });

    runQueryMock.mockResolvedValueOnce({
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      count: 1,
      lastRequest: 1_000,
    });

    const result = await storage.get(rawKey);
    expect(result).toEqual({
      key: expectedKey,
      count: 1,
      lastRequest: 1_000,
    });
  });

  it("increments counts for burst requests via update flag", async () => {
    runMutationMock.mockResolvedValue(null);
    const storage = createConvexRateLimitStorage(ctx);

    const rawKey = "203.0.113.5/sign-up/email";
    await storage.set(rawKey, {
      key: rawKey,
      count: 1,
      lastRequest: 1_000,
    });

    await storage.set(
      rawKey,
      {
        key: rawKey,
        count: 2,
        lastRequest: 1_005,
      },
      true,
    );

    const expectedKey = hashKey(rawKey);
    const { ip, path } = splitKey(rawKey);

    expect(runMutationMock).toHaveBeenNthCalledWith(1, expect.anything(), {
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      value: {
        count: 1,
        lastRequest: 1_000,
      },
      update: false,
    });
    expect(runMutationMock).toHaveBeenNthCalledWith(2, expect.anything(), {
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      value: {
        count: 2,
        lastRequest: 1_005,
      },
      update: true,
    });
  });

  it("falls back to secondary storage when Convex persistence fails", async () => {
    runMutationMock.mockRejectedValueOnce(new Error("db offline"));

    const storage = createConvexRateLimitStorage(ctx);
    const rawKey = "203.0.113.5/sign-in/email";

    await storage.set(rawKey, {
      key: rawKey,
      count: 1,
      lastRequest: 1_000,
    });

    const expectedKey = hashKey(rawKey);
    expect(secondaryStorageSetMock).toHaveBeenCalledWith(
      `rate-limit:${expectedKey}`,
      JSON.stringify({
        count: 1,
        lastRequest: 1_000,
      }),
    );
  });

  it("reads from secondary storage when Convex queries fail", async () => {
    runQueryMock.mockRejectedValueOnce(new Error("db offline"));
    secondaryStorageGetMock.mockResolvedValueOnce(
      JSON.stringify({ count: 4, lastRequest: 2_000 }),
    );

    const storage = createConvexRateLimitStorage(ctx);
    const rawKey = "203.0.113.5/otp";
    const value = await storage.get(rawKey);

    const expectedKey = hashKey(rawKey);
    expect(secondaryStorageGetMock).toHaveBeenCalledWith(
      `rate-limit:${expectedKey}`,
    );
    expect(value).toEqual({
      key: expectedKey,
      count: 4,
      lastRequest: 2_000,
    });
  });
});
