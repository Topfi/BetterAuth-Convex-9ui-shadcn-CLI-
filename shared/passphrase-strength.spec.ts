import { describe, expect, it } from "vitest";

import {
  DEFAULT_MINIMUM_PASSPHRASE_SCORE,
  evaluatePassphraseStrength,
} from "./passphrase-strength";

describe("evaluatePassphraseStrength", () => {
  it("rejects passphrases containing account metadata", () => {
    const result = evaluatePassphraseStrength({
      passphrase: "EmailUsed2024!",
      metadata: [" Primary.Email@example.com  ", "primary.email@example.com"],
    });

    expect(result.acceptable).toBe(false);
    expect(result.reason).toBe("contains_metadata");
    expect(result.normalizedInputs).toEqual([
      "primary.email@example.com",
      "primary",
      "email",
      "example",
    ]);
  });

  it("rejects passphrases below the minimum zxcvbn score", () => {
    const result = evaluatePassphraseStrength({
      passphrase: "aaaaaaa",
      metadata: [],
    });

    expect(result.score).toBeLessThan(DEFAULT_MINIMUM_PASSPHRASE_SCORE);
    expect(result.acceptable).toBe(false);
    expect(result.reason).toBe("score_too_low");
  });

  it("accepts strong passphrases and keeps feedback available", () => {
    const result = evaluatePassphraseStrength({
      passphrase: "library-quiet-yellow-planet-92",
      metadata: [],
    });

    expect(result.acceptable).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(Array.isArray(result.feedback.suggestions)).toBe(true);
    expect(
      result.feedback.warning === undefined ||
        typeof result.feedback.warning === "string",
    ).toBe(true);
  });

  it("normalizes metadata inputs consistently", () => {
    const result = evaluatePassphraseStrength({
      passphrase: "Tr1cky-Passphrase-2024",
      metadata: [
        "  USER@example.com  ",
        "user@example.com",
        "User",
        "",
        undefined,
      ],
    });

    expect(result.normalizedInputs).toEqual([
      "user@example.com",
      "user",
      "example",
    ]);
  });
});
