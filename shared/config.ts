import { z } from "zod";

const githubClientIdPattern = /^[A-Za-z0-9._-]+$/;

export const githubConfigSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  errors: z.array(z.string()),
});

export type GithubConfig = z.infer<typeof githubConfigSchema>;

export const googleConfigSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  errors: z.array(z.string()),
});

export type GoogleConfig = z.infer<typeof googleConfigSchema>;

export const appleConfigSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  appBundleIdentifier: z.string().optional(),
  errors: z.array(z.string()),
});

export type AppleConfig = z.infer<typeof appleConfigSchema>;

const mailBrandSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  tagline: z.string().min(1).optional(),
});

export const mailConfigSchema = z.object({
  preview: z.boolean(),
  resendApiKey: z.string().min(20).optional(),
  from: z.string(),
  brand: mailBrandSchema,
  errors: z.array(z.string()),
});

export type MailConfig = z.infer<typeof mailConfigSchema>;

const truthyValues = new Set(["true", "1", "yes", "y", "on"]);
const falsyValues = new Set(["false", "0", "no", "n", "off", ""]);

const defaultMailFrom = "Test <onboarding@example.com>";

function parseBooleanToggle(raw?: string): boolean {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  if (truthyValues.has(normalized)) {
    return true;
  }
  if (falsyValues.has(normalized)) {
    return false;
  }
  return false;
}

function parseOptionalBoolean(raw?: string): boolean | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (truthyValues.has(normalized)) {
    return true;
  }
  if (falsyValues.has(normalized)) {
    return false;
  }
  return null;
}

function normalizeBrandValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}

function isValidFromAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes("<") || trimmed.includes(">")) {
    const start = trimmed.indexOf("<");
    const end = trimmed.indexOf(">");
    if (start === -1 || end === -1 || end <= start + 1) {
      return false;
    }
    const address = trimmed.slice(start + 1, end).trim();
    return address.includes("@");
  }
  return trimmed.includes("@");
}

export function readGithubConfigFromEnv(
  env: Record<string, string | undefined>,
): GithubConfig {
  const enabled = parseBooleanToggle(env.GITHUB_OAUTH);
  const clientIdRaw = env.GITHUB_CLIENT_ID ?? "";
  const clientSecretRaw = env.GITHUB_CLIENT_SECRET ?? "";

  const trimmedClientId = clientIdRaw.trim();
  const trimmedClientSecret = clientSecretRaw.trim();

  const errors: string[] = [];
  let clientId: string | undefined;
  let clientSecret: string | undefined;

  if (enabled) {
    if (!trimmedClientId) {
      errors.push("GitHub OAuth client ID is required.");
    } else if (!githubClientIdPattern.test(trimmedClientId)) {
      errors.push(
        "GitHub OAuth client ID may only contain letters, digits, periods, underscores, or hyphens.",
      );
    } else {
      clientId = trimmedClientId;
    }

    if (!trimmedClientSecret) {
      errors.push("GitHub OAuth client secret is required.");
    } else if (trimmedClientSecret.length < 10) {
      errors.push(
        "GitHub OAuth client secret must be at least 10 characters long.",
      );
    } else {
      clientSecret = trimmedClientSecret;
    }
  } else {
    if (trimmedClientId) {
      clientId = trimmedClientId;
    }
    if (trimmedClientSecret) {
      clientSecret = trimmedClientSecret;
    }
  }

  return githubConfigSchema.parse({
    enabled,
    clientId,
    clientSecret,
    errors,
  });
}

export function readGoogleConfigFromEnv(
  env: Record<string, string | undefined>,
): GoogleConfig {
  const enabled = parseBooleanToggle(env.GOOGLE_OAUTH);
  const clientIdRaw = env.GOOGLE_CLIENT_ID ?? "";
  const clientSecretRaw = env.GOOGLE_CLIENT_SECRET ?? "";

  const trimmedClientId = clientIdRaw.trim();
  const trimmedClientSecret = clientSecretRaw.trim();

  const errors: string[] = [];
  let clientId: string | undefined;
  let clientSecret: string | undefined;

  if (enabled) {
    if (!trimmedClientId) {
      errors.push("Google OAuth client ID is required.");
    } else {
      clientId = trimmedClientId;
    }

    if (!trimmedClientSecret) {
      errors.push("Google OAuth client secret is required.");
    } else {
      clientSecret = trimmedClientSecret;
    }
  } else {
    if (trimmedClientId) {
      clientId = trimmedClientId;
    }
    if (trimmedClientSecret) {
      clientSecret = trimmedClientSecret;
    }
  }

  return googleConfigSchema.parse({
    enabled,
    clientId,
    clientSecret,
    errors,
  });
}

export function readAppleConfigFromEnv(
  env: Record<string, string | undefined>,
): AppleConfig {
  const enabled = parseBooleanToggle(env.APPLE_OAUTH);
  const clientIdRaw = env.APPLE_CLIENT_ID ?? "";
  const clientSecretRaw = env.APPLE_CLIENT_SECRET ?? "";
  const bundleIdRaw = env.APPLE_APP_BUNDLE_IDENTIFIER ?? "";

  const trimmedClientId = clientIdRaw.trim();
  const trimmedClientSecret = clientSecretRaw.trim();
  const trimmedBundleId = bundleIdRaw.trim();

  const errors: string[] = [];
  let clientId: string | undefined;
  let clientSecret: string | undefined;
  let appBundleIdentifier: string | undefined;

  if (enabled) {
    if (!trimmedClientId) {
      errors.push("Apple Sign In client ID is required.");
    } else {
      clientId = trimmedClientId;
    }

    if (!trimmedClientSecret) {
      errors.push("Apple Sign In client secret is required.");
    } else {
      clientSecret = trimmedClientSecret;
    }
  } else {
    if (trimmedClientId) {
      clientId = trimmedClientId;
    }
    if (trimmedClientSecret) {
      clientSecret = trimmedClientSecret;
    }
  }

  if (trimmedBundleId) {
    appBundleIdentifier = trimmedBundleId;
  }

  return appleConfigSchema.parse({
    enabled,
    clientId,
    clientSecret,
    appBundleIdentifier,
    errors,
  });
}

export function readMailConfigFromEnv(
  env: Record<string, string | undefined>,
): MailConfig {
  const previewToggle = parseOptionalBoolean(env.MAIL_CONSOLE_PREVIEW);
  const preview = previewToggle ?? true;

  const errors: string[] = [];

  const mailFromRaw = env.MAIL_FROM ?? "";
  const mailFromTrimmed = mailFromRaw.trim();
  let from = mailFromTrimmed || defaultMailFrom;
  if (!isValidFromAddress(from)) {
    errors.push(
      "MAIL_FROM must be a valid email address or display name with an email (e.g. 'Name <name@example.com>').",
    );
    from = defaultMailFrom;
  }

  const rawResendKey = env.RESEND_API_KEY?.trim() ?? "";
  let resendApiKey: string | undefined;
  if (!preview) {
    if (!rawResendKey) {
      errors.push(
        "RESEND_API_KEY is required when MAIL_CONSOLE_PREVIEW=false.",
      );
    } else if (rawResendKey.length < 20) {
      errors.push("RESEND_API_KEY must be at least 20 characters long.");
    } else {
      resendApiKey = rawResendKey;
    }
  }

  const brandName = normalizeBrandValue(env.BRAND_NAME);
  const brandLogoUrlRaw = normalizeBrandValue(env.BRAND_LOGO_URL);
  const brandTagline = normalizeBrandValue(env.BRAND_TAGLINE);

  let brandLogoUrl = brandLogoUrlRaw;
  if (brandLogoUrl && !/^https?:\/\//i.test(brandLogoUrl)) {
    errors.push("BRAND_LOGO_URL must start with http:// or https://.");
    brandLogoUrl = undefined;
  }

  const brand = {
    name: brandName,
    logoUrl: brandLogoUrl,
    tagline: brandTagline,
  } satisfies MailConfig["brand"];

  return mailConfigSchema.parse({
    preview,
    resendApiKey,
    from,
    brand,
    errors,
  });
}
