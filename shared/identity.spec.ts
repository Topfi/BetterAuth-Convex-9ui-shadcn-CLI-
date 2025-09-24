import { describe, expect, it } from "vitest";
import {
  emailSchema,
  identityPreviewSamples,
  normalizeUsername,
  pickIdentityPreviewSample,
  usernameDisplaySchema,
  usernameFromEmail,
  usernameLowerSchema,
} from "./identity";

describe("username schemas", () => {
  it("accepts valid display usernames", () => {
    const values = ["Alice", "Bob76", "a1b2c3"];
    for (const value of values) {
      const parsed = usernameDisplaySchema.safeParse(value);
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects invalid characters or length", () => {
    const invalidValues = [
      "ab",
      "bad name",
      "name!",
      "jo.hn",
      "my_name",
      "dash-name",
      "a".repeat(33),
    ];
    for (const value of invalidValues) {
      const parsed = usernameDisplaySchema.safeParse(value);
      expect(parsed.success).toBe(false);
    }
  });

  it("validates canonical usernames", () => {
    expect(() => usernameLowerSchema.parse("alice")).not.toThrow();
    expect(usernameLowerSchema.safeParse("ALICE").success).toBe(false);
  });
});

describe("normalizeUsername", () => {
  it("normalizes case while preserving display casing", () => {
    const normalized = normalizeUsername("Bob");
    expect(normalized).toEqual({ lower: "bob", display: "Bob" });
  });

  it("trims surrounding whitespace", () => {
    const normalized = normalizeUsername("  Carol  ");
    expect(normalized).toEqual({ lower: "carol", display: "Carol" });
  });
});

describe("usernameFromEmail", () => {
  it("uses the email local-part while preserving display case", () => {
    const username = usernameFromEmail("Bob76@mail.com");
    expect(username).toEqual({ lower: "bob76", display: "Bob76" });
  });

  it("drops +tag and non-alphanumerics", () => {
    const username = usernameFromEmail("dev.bob-76+qa@example.com");
    expect(username).toEqual({ lower: "devbob76", display: "devbob76" });
  });

  it("normalizes Bob-76 while preserving casing", () => {
    const username = usernameFromEmail("Bob-76+dev@mail.com");
    expect(username).toEqual({ lower: "bob76", display: "Bob76" });
  });
});

describe("identity preview samples", () => {
  it("exposes valid username and email combinations", () => {
    expect(identityPreviewSamples.length).toBeGreaterThan(0);
    for (const sample of identityPreviewSamples) {
      expect(usernameDisplaySchema.safeParse(sample.username).success).toBe(
        true,
      );
      expect(emailSchema.safeParse(sample.email).success).toBe(true);
    }
  });

  it("picks a sample deterministically using the provided random source", () => {
    const first = pickIdentityPreviewSample(() => 0);
    expect(first).toBe(identityPreviewSamples[0]);

    const nearOne = pickIdentityPreviewSample(() => 0.9999999);
    expect(nearOne).toBe(
      identityPreviewSamples[identityPreviewSamples.length - 1],
    );
  });
});
