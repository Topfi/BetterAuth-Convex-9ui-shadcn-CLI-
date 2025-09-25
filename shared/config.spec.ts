import { describe, expect, it } from "vitest";
import {
  readAppleConfigFromEnv,
  readAuthFeatureConfigFromEnv,
  readGoogleConfigFromEnv,
} from "./config";

describe("readGoogleConfigFromEnv", () => {
  it("returns disabled config when toggle is falsy but preserves provided credentials", () => {
    const config = readGoogleConfigFromEnv({
      GOOGLE_OAUTH: "no",
      GOOGLE_CLIENT_ID: " client-id ",
      GOOGLE_CLIENT_SECRET: " super-secret-value ",
    });

    expect(config).toEqual({
      enabled: false,
      clientId: "client-id",
      clientSecret: "super-secret-value",
      errors: [],
    });
  });

  it("collects errors when enabled without credentials", () => {
    const config = readGoogleConfigFromEnv({
      GOOGLE_OAUTH: "true",
      GOOGLE_CLIENT_ID: "  ",
      GOOGLE_CLIENT_SECRET: " ",
    });

    expect(config.enabled).toBe(true);
    expect(config.clientId).toBeUndefined();
    expect(config.clientSecret).toBeUndefined();
    expect(config.errors).toEqual([
      "Google OAuth client ID is required.",
      "Google OAuth client secret is required.",
    ]);
  });

  it("normalizes valid credentials when enabled", () => {
    const config = readGoogleConfigFromEnv({
      GOOGLE_OAUTH: "true",
      GOOGLE_CLIENT_ID: "google.apps.client",
      GOOGLE_CLIENT_SECRET: "averysecuresecret",
    });

    expect(config).toEqual({
      enabled: true,
      clientId: "google.apps.client",
      clientSecret: "averysecuresecret",
      errors: [],
    });
  });
});

describe("readAppleConfigFromEnv", () => {
  it("returns disabled config when toggle is falsy", () => {
    const config = readAppleConfigFromEnv({
      APPLE_OAUTH: "false",
      APPLE_CLIENT_ID: " com.example.service ",
      APPLE_CLIENT_SECRET: " apple-secret ",
      APPLE_APP_BUNDLE_IDENTIFIER: " com.example.app ",
    });

    expect(config).toEqual({
      enabled: false,
      clientId: "com.example.service",
      clientSecret: "apple-secret",
      appBundleIdentifier: "com.example.app",
      errors: [],
    });
  });

  it("requires credentials when enabled", () => {
    const config = readAppleConfigFromEnv({
      APPLE_OAUTH: "true",
      APPLE_CLIENT_ID: "",
      APPLE_CLIENT_SECRET: "",
    });

    expect(config.enabled).toBe(true);
    expect(config.errors).toEqual([
      "Apple Sign In client ID is required.",
      "Apple Sign In client secret is required.",
    ]);
  });

  it("allows optional bundle identifier and trims values", () => {
    const config = readAppleConfigFromEnv({
      APPLE_OAUTH: "1",
      APPLE_CLIENT_ID: "com.example.service",
      APPLE_CLIENT_SECRET: "supersecretkey",
      APPLE_APP_BUNDLE_IDENTIFIER: " com.example.app ",
    });

    expect(config).toEqual({
      enabled: true,
      clientId: "com.example.service",
      clientSecret: "supersecretkey",
      appBundleIdentifier: "com.example.app",
      errors: [],
    });
  });
});

describe("readAuthFeatureConfigFromEnv", () => {
  it("defaults to enabling all flows when toggles are omitted", () => {
    const config = readAuthFeatureConfigFromEnv({});

    expect(config).toEqual({
      passphraseSignIn: true,
      passphraseSignUp: true,
      magicLinkSignIn: true,
      verificationCodeSignIn: true,
    });
  });

  it("honours explicit boolean-like toggle values", () => {
    const config = readAuthFeatureConfigFromEnv({
      AUTH_PASSPHRASE_SIGN_IN: "false",
      AUTH_PASSPHRASE_SIGN_UP: "0",
      AUTH_MAGIC_LINK_SIGN_IN: "off",
      AUTH_VERIFICATION_CODE_SIGN_IN: "no",
    });

    expect(config).toEqual({
      passphraseSignIn: false,
      passphraseSignUp: false,
      magicLinkSignIn: false,
      verificationCodeSignIn: false,
    });
  });

  it("treats unknown values as enabled to avoid accidental lockouts", () => {
    const config = readAuthFeatureConfigFromEnv({
      AUTH_PASSPHRASE_SIGN_IN: "maybe",
      AUTH_PASSPHRASE_SIGN_UP: "enable",
    });

    expect(config.passphraseSignIn).toBe(true);
    expect(config.passphraseSignUp).toBe(true);
  });
});
