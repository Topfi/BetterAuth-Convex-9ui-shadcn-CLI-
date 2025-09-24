import { describe, expect, it } from "vitest";
import { normalizeMailUrl } from "./url";

describe("normalizeMailUrl", () => {
  it("returns a valid https url untouched", () => {
    const url = "https://brainy-canary-912.convex.site/api/auth/magic-link";
    expect(normalizeMailUrl(url)).toBe(url);
  });

  it("trims whitespace and wrapper quotes", () => {
    const raw = '  "https://example.com/path"  ';
    expect(normalizeMailUrl(raw)).toBe("https://example.com/path");
  });

  it("repairs duplicated protocol artifacts from quoted values", () => {
    const raw = 'https://"https://example.com/verify"';
    expect(normalizeMailUrl(raw)).toBe("https://example.com/verify");
  });

  it("throws when no http url can be recovered", () => {
    expect(() => normalizeMailUrl("not a link")).toThrow(
      /Unable to normalize mail URL/,
    );
  });
});
