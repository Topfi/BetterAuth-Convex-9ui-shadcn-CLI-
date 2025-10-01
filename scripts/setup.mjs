import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const log = (message) => console.log(`[setup] ${message}`);

const run = (command) => {
  log(`$ ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
};

const runAllowFail = (command) => {
  log(`$ ${command}`);
  try {
    execSync(command, { stdio: "inherit", env: process.env });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
};

const ENV_PATH = resolve(process.cwd(), ".env.local");
const SECRET_ENV_KEY = "BETTER_AUTH_SECRET";
const SECRET_MIN_LENGTH = 32;
const SECRET_SCRUB_REGEX = /[A-Za-z0-9+/=]{36,}/g;

const maskPotentialSecret = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(SECRET_SCRUB_REGEX, "***");
};

const toText = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("utf8");
  }
  return String(value);
};

const sanitizeErrorMessage = (error) => {
  if (!error) {
    return "Unknown error";
  }
  const parts = [];
  if (error.message) {
    parts.push(toText(error.message));
  }
  if (error.stdout) {
    parts.push(toText(error.stdout));
  }
  if (error.stderr) {
    parts.push(toText(error.stderr));
  }
  const combined = parts.filter(Boolean).join(" \n").trim();
  const base = combined || toText(error);
  const scrubbed = maskPotentialSecret(base);
  return scrubbed.length > 0 ? scrubbed : "Unknown error";
};

const analyzeSecretCandidate = (value) => {
  if (value === undefined || value === null) {
    return { status: "missing" };
  }
  const trimmed = String(value).trim();
  if (trimmed.length === 0) {
    return { status: "missing" };
  }
  if (trimmed.length < SECRET_MIN_LENGTH) {
    return { status: "too_short" };
  }
  return { status: "valid", value: trimmed };
};

const generateSecret = () => randomBytes(32).toString("base64");

const readConvexEnvValue = (key) => {
  log(`Checking ${key} in Convex env`);
  try {
    const output = execSync(`npx convex env get ${key}`, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    const trimmed = output.toString("utf8").trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch (error) {
    if (typeof error.status === "number") {
      log(`INFO ${key} not found in Convex env; treating as missing.`);
      return undefined;
    }
    throw new Error(
      `Failed to read ${key} from Convex env: ${sanitizeErrorMessage(error)}`,
    );
  }
};

const setConvexEnvValue = (key, value) => {
  log(`Setting ${key} in Convex env`);
  try {
    execSync(`npx convex env set ${key} ${formatForShell(value)}`, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
  } catch (error) {
    throw new Error(
      `Failed to set ${key} in Convex env: ${sanitizeErrorMessage(error)}`,
    );
  }
};

class EnvFile {
  constructor(text) {
    const normalized = text.replace(/\r\n/g, "\n");
    this.lines = normalized === "" ? [] : normalized.split("\n");
  }

  parseLine(line) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) return undefined;
    return { key: match[1], value: match[2] };
  }

  findKeyIndex(key) {
    for (let i = 0; i < this.lines.length; i += 1) {
      const parsed = this.parseLine(this.lines[i]);
      if (parsed && parsed.key === key) {
        return i;
      }
    }
    return -1;
  }

  get(key) {
    for (let i = this.lines.length - 1; i >= 0; i -= 1) {
      const parsed = this.parseLine(this.lines[i]);
      if (parsed && parsed.key === key) {
        return parsed.value;
      }
    }
    return undefined;
  }

  findBlockStart(key, comment) {
    const keyIndex = this.findKeyIndex(key);
    if (keyIndex === -1) return -1;
    if (comment) {
      const commentIndex = keyIndex - 1;
      if (commentIndex >= 0 && this.lines[commentIndex] === comment) {
        return commentIndex;
      }
    }
    return keyIndex;
  }

  upsertBlock({ key, value, comment, leadingBlank = false }) {
    if (value === undefined) return;

    const kvLine = `${key}=${value}`;

    let keyIndex = this.findKeyIndex(key);
    if (keyIndex !== -1) {
      this.lines[keyIndex] = kvLine;
    } else {
      if (this.lines.length > 0 && this.lines[this.lines.length - 1] !== "") {
        this.lines.push("");
      }
      if (comment) {
        this.lines.push(comment);
      }
      this.lines.push(kvLine);
      keyIndex = this.lines.length - 1;
    }

    if (comment) {
      let commentIndex = keyIndex - 1;
      if (commentIndex >= 0 && this.lines[commentIndex].startsWith("#")) {
        if (this.lines[commentIndex] !== comment) {
          this.lines[commentIndex] = comment;
        }
      } else {
        this.lines.splice(keyIndex, 0, comment);
        keyIndex += 1;
        commentIndex = keyIndex - 1;
      }
      if (commentIndex >= 0 && this.lines[commentIndex] === "") {
        this.lines.splice(commentIndex, 1);
        keyIndex -= 1;
      }
    }

    let blockStart = this.findBlockStart(key, comment);
    if (blockStart === -1) {
      blockStart = keyIndex;
    }

    if (leadingBlank && blockStart > 0) {
      let blanks = 0;
      let cursor = blockStart - 1;
      while (cursor >= 0 && this.lines[cursor] === "") {
        blanks += 1;
        if (blanks > 1) {
          this.lines.splice(cursor, 1);
          blockStart -= 1;
        }
        cursor -= 1;
      }
      if (blanks === 0) {
        this.lines.splice(blockStart, 0, "");
        blockStart += 1;
      }
    }

    if (!leadingBlank) {
      while (blockStart > 0 && this.lines[blockStart - 1] === "") {
        this.lines.splice(blockStart - 1, 1);
        blockStart -= 1;
      }
    }
  }

  normalizeBlankLines() {
    const result = [];
    let blankCount = 0;
    for (const line of this.lines) {
      if (line === "") {
        blankCount += 1;
        if (blankCount > 1) {
          continue;
        }
        if (result.length === 0) {
          continue;
        }
        result.push("");
      } else {
        blankCount = 0;
        result.push(line);
      }
    }
    while (result.length > 0 && result[result.length - 1] === "") {
      result.pop();
    }
    this.lines = result;
  }

  toString() {
    this.normalizeBlankLines();
    if (this.lines.length === 0) {
      return "";
    }
    return `${this.lines.join("\n")}\n`;
  }
}

function parseSlugFromConvexUrl(url) {
  if (!url) return undefined;
  const match = /^(?:https?:\/\/)?([a-z0-9-]+)\.convex\.cloud\/?$/i.exec(
    url.trim(),
  );
  return match ? match[1] : undefined;
}

function parseSlugFromDeployment(deployment) {
  if (!deployment) return undefined;
  const match = /^dev:([a-z0-9-]+)$/i.exec(deployment.trim());
  return match ? match[1] : undefined;
}

function deriveSiteUrlFromSlug(slug) {
  return slug ? `https://${slug}.convex.site` : undefined;
}

function canonicalizeBooleanString(value) {
  if (value === undefined || value === null) return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return "true";
  }
  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return "false";
  }
  return null;
}

function stripInlineComment(value) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  const commentMatch = /^(.*?)\s+#.*$/.exec(trimmed);
  const withoutComment = commentMatch ? commentMatch[1] : trimmed;
  return withoutComment.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function formatForShell(value) {
  if (!/[\s"'`$]/.test(value)) {
    return value;
  }
  if (process.platform === "win32") {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function main() {
  try {
    run("npm install");
    const bootstrapResult = runAllowFail("npx convex dev --once");
    if (!bootstrapResult.ok) {
      log(
        "WARN Initial Convex bootstrap failed (expected if SITE_URL is missing). Proceeding after env sync.",
      );
    }

    log(`Reading ${ENV_PATH}`);
    const envText = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
    const envFile = new EnvFile(envText);

    const rawDeployment = envFile.get("CONVEX_DEPLOYMENT");
    const rawConvexUrl = envFile.get("VITE_CONVEX_URL");
    const rawConvexSiteUrl = envFile.get("VITE_CONVEX_SITE_URL");
    const rawSiteUrl = envFile.get("SITE_URL");
    const rawGithubOAuth = envFile.get("GITHUB_OAUTH");
    const rawGithubClientId = envFile.get("GITHUB_CLIENT_ID");
    const rawGithubClientSecret = envFile.get("GITHUB_CLIENT_SECRET");
    const rawGoogleOAuth = envFile.get("GOOGLE_OAUTH");
    const rawGoogleClientId = envFile.get("GOOGLE_CLIENT_ID");
    const rawGoogleClientSecret = envFile.get("GOOGLE_CLIENT_SECRET");
    const rawAppleOAuth = envFile.get("APPLE_OAUTH");
    const rawAppleClientId = envFile.get("APPLE_CLIENT_ID");
    const rawAppleClientSecret = envFile.get("APPLE_CLIENT_SECRET");
    const rawAppleBundleId = envFile.get("APPLE_APP_BUNDLE_IDENTIFIER");
    const rawPassphraseSignIn = envFile.get("AUTH_PASSPHRASE_SIGN_IN");
    const rawPassphraseSignUp = envFile.get("AUTH_PASSPHRASE_SIGN_UP");
    const rawMagicLinkSignIn = envFile.get("AUTH_MAGIC_LINK_SIGN_IN");
    const rawVerificationCodeSignIn = envFile.get(
      "AUTH_VERIFICATION_CODE_SIGN_IN",
    );
    const rawMailPreview = envFile.get("MAIL_CONSOLE_PREVIEW");
    const rawResendApiKey = envFile.get("RESEND_API_KEY");
    const rawMailFrom = envFile.get("MAIL_FROM");
    const rawBrandName = envFile.get("BRAND_NAME");
    const rawBrandLogoUrl = envFile.get("BRAND_LOGO_URL");
    const rawBrandTagline = envFile.get("BRAND_TAGLINE");

    const trimmedDeployment = stripInlineComment(rawDeployment);
    const trimmedConvexUrl = stripInlineComment(rawConvexUrl);
    const trimmedSiteUrl = stripInlineComment(rawSiteUrl);
    const trimmedGithubOAuth = stripInlineComment(rawGithubOAuth);
    const trimmedGithubClientId = stripInlineComment(rawGithubClientId);
    const trimmedGithubClientSecret = stripInlineComment(rawGithubClientSecret);
    const trimmedGoogleOAuth = stripInlineComment(rawGoogleOAuth);
    const trimmedGoogleClientId = stripInlineComment(rawGoogleClientId);
    const trimmedGoogleClientSecret = stripInlineComment(rawGoogleClientSecret);
    const trimmedAppleOAuth = stripInlineComment(rawAppleOAuth);
    const trimmedAppleClientId = stripInlineComment(rawAppleClientId);
    const trimmedAppleClientSecret = stripInlineComment(rawAppleClientSecret);
    const trimmedAppleBundleId = stripInlineComment(rawAppleBundleId);
    const trimmedPassphraseSignIn = stripInlineComment(rawPassphraseSignIn);
    const trimmedPassphraseSignUp = stripInlineComment(rawPassphraseSignUp);
    const trimmedMagicLinkSignIn = stripInlineComment(rawMagicLinkSignIn);
    const trimmedVerificationCodeSignIn = stripInlineComment(
      rawVerificationCodeSignIn,
    );
    const trimmedMailPreview = stripInlineComment(rawMailPreview);
    const trimmedResendApiKey = stripInlineComment(rawResendApiKey);
    const trimmedMailFrom = stripInlineComment(rawMailFrom);
    const trimmedBrandName = stripInlineComment(rawBrandName);
    const trimmedBrandLogoUrl = stripInlineComment(rawBrandLogoUrl);
    const trimmedBrandTagline = stripInlineComment(rawBrandTagline);

    if (!bootstrapResult.ok && !trimmedDeployment) {
      throw new Error(
        "Convex project bootstrap failed before CONVEX_DEPLOYMENT was written. Re-run `npm run setup`.",
      );
    }

    const slugFromUrl = parseSlugFromConvexUrl(trimmedConvexUrl);
    const slugFromDeployment = parseSlugFromDeployment(trimmedDeployment);
    const derivedSiteVariant = deriveSiteUrlFromSlug(
      slugFromUrl ?? slugFromDeployment,
    );

    if (rawDeployment !== undefined) {
      envFile.upsertBlock({
        key: "CONVEX_DEPLOYMENT",
        value: rawDeployment,
        comment: "# Deployment used by `npx convex dev`",
        leadingBlank: false,
      });
    }

    if (rawConvexUrl !== undefined) {
      envFile.upsertBlock({
        key: "VITE_CONVEX_URL",
        value: rawConvexUrl,
        leadingBlank: true,
      });
    }

    let convexSiteValue = derivedSiteVariant ?? rawConvexSiteUrl;
    if (convexSiteValue !== undefined) {
      envFile.upsertBlock({
        key: "VITE_CONVEX_SITE_URL",
        value: convexSiteValue,
        comment: "# Same as VITE_CONVEX_URL but ends in .site",
        leadingBlank: true,
      });
    } else {
      log(
        "WARN Could not derive VITE_CONVEX_SITE_URL (missing or unparsable VITE_CONVEX_URL / CONVEX_DEPLOYMENT). Leaving unchanged.",
      );
    }

    let siteUrlValue = rawSiteUrl;
    let siteUrlForConvex = trimmedSiteUrl;
    if (!siteUrlForConvex) {
      siteUrlForConvex = "http://localhost:5173";
      siteUrlValue = siteUrlForConvex;
    }

    envFile.upsertBlock({
      key: "SITE_URL",
      value: siteUrlValue ?? siteUrlForConvex,
      comment: "# Your local site URL",
      leadingBlank: true,
    });

    const canonicalGithubOAuth = canonicalizeBooleanString(trimmedGithubOAuth);
    if (canonicalGithubOAuth === null && trimmedGithubOAuth) {
      log(
        "WARN GITHUB_OAUTH has an unexpected value; defaulting to 'false'. Update the toggle after setup if needed.",
      );
    }

    const canonicalGoogleOAuth = canonicalizeBooleanString(trimmedGoogleOAuth);
    if (canonicalGoogleOAuth === null && trimmedGoogleOAuth) {
      log(
        "WARN GOOGLE_OAUTH has an unexpected value; defaulting to 'false'. Update the toggle after setup if needed.",
      );
    }

    const canonicalAppleOAuth = canonicalizeBooleanString(trimmedAppleOAuth);
    if (canonicalAppleOAuth === null && trimmedAppleOAuth) {
      log(
        "WARN APPLE_OAUTH has an unexpected value; defaulting to 'false'. Update the toggle after setup if needed.",
      );
    }

    const canonicalMailPreview = canonicalizeBooleanString(trimmedMailPreview);
    if (trimmedMailPreview && canonicalMailPreview === null) {
      log(
        "WARN MAIL_CONSOLE_PREVIEW has an unexpected value; defaulting to 'true'. Update the toggle after setup if needed.",
      );
    }

    // Runs Convex CLI commands and writes .env.local; no automated test covers this path.
    const canonicalPassphraseSignIn = canonicalizeBooleanString(
      trimmedPassphraseSignIn,
    );
    if (trimmedPassphraseSignIn && canonicalPassphraseSignIn === null) {
      log(
        "WARN AUTH_PASSPHRASE_SIGN_IN has an unexpected value; defaulting to 'true'. Update the toggle after setup if needed.",
      );
    }

    const canonicalPassphraseSignUp = canonicalizeBooleanString(
      trimmedPassphraseSignUp,
    );
    if (trimmedPassphraseSignUp && canonicalPassphraseSignUp === null) {
      log(
        "WARN AUTH_PASSPHRASE_SIGN_UP has an unexpected value; defaulting to 'true'. Update the toggle after setup if needed.",
      );
    }

    const canonicalMagicLinkSignIn = canonicalizeBooleanString(
      trimmedMagicLinkSignIn,
    );
    if (trimmedMagicLinkSignIn && canonicalMagicLinkSignIn === null) {
      log(
        "WARN AUTH_MAGIC_LINK_SIGN_IN has an unexpected value; defaulting to 'true'. Update the toggle after setup if needed.",
      );
    }

    const canonicalVerificationCodeSignIn = canonicalizeBooleanString(
      trimmedVerificationCodeSignIn,
    );
    if (
      trimmedVerificationCodeSignIn &&
      canonicalVerificationCodeSignIn === null
    ) {
      log(
        "WARN AUTH_VERIFICATION_CODE_SIGN_IN has an unexpected value; defaulting to 'true'. Update the toggle after setup if needed.",
      );
    }

    const mailPreviewValue = canonicalMailPreview ?? "true";
    const mailFromValue =
      trimmedMailFrom && trimmedMailFrom.length > 0
        ? trimmedMailFrom
        : "Test <onboarding@example.com>";
    const resendApiKeyValue = trimmedResendApiKey ?? "";
    const brandNameValue = trimmedBrandName ?? "";
    const brandLogoUrlValue = trimmedBrandLogoUrl ?? "";
    const brandTaglineValue = trimmedBrandTagline ?? "";

    const githubOAuthValue = canonicalGithubOAuth ?? "false";
    const githubClientIdValue = trimmedGithubClientId ?? "";
    const githubClientSecretValue = trimmedGithubClientSecret ?? "";
    const googleOAuthValue = canonicalGoogleOAuth ?? "false";
    const googleClientIdValue = trimmedGoogleClientId ?? "";
    const googleClientSecretValue = trimmedGoogleClientSecret ?? "";
    const appleOAuthValue = canonicalAppleOAuth ?? "false";
    const appleClientIdValue = trimmedAppleClientId ?? "";
    const appleClientSecretValue = trimmedAppleClientSecret ?? "";
    const appleBundleIdentifierValue = trimmedAppleBundleId ?? "";
    const passphraseSignInValue = canonicalPassphraseSignIn ?? "true";
    const passphraseSignUpValue = canonicalPassphraseSignUp ?? "true";
    const magicLinkSignInValue = canonicalMagicLinkSignIn ?? "true";
    const verificationCodeSignInValue =
      canonicalVerificationCodeSignIn ?? "true";

    envFile.upsertBlock({
      key: "GITHUB_OAUTH",
      value: githubOAuthValue,
      comment: "# GitHub OAuth (toggle provider visibility; 'true' or 'false')",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "GITHUB_CLIENT_ID",
      value: githubClientIdValue,
      comment:
        "# GitHub OAuth App credentials (required when GITHUB_OAUTH=true)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "GITHUB_CLIENT_SECRET",
      value: githubClientSecretValue,
      leadingBlank: false,
    });

    envFile.upsertBlock({
      key: "GOOGLE_OAUTH",
      value: googleOAuthValue,
      comment: "# Google OAuth (toggle provider visibility; 'true' or 'false')",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "GOOGLE_CLIENT_ID",
      value: googleClientIdValue,
      comment: "# Google OAuth credentials (required when GOOGLE_OAUTH=true)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "GOOGLE_CLIENT_SECRET",
      value: googleClientSecretValue,
      leadingBlank: false,
    });

    envFile.upsertBlock({
      key: "APPLE_OAUTH",
      value: appleOAuthValue,
      comment:
        "# Apple Sign In (toggle provider visibility; 'true' or 'false')",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "APPLE_CLIENT_ID",
      value: appleClientIdValue,
      comment: "# Apple Sign In Service ID (required when APPLE_OAUTH=true)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "APPLE_CLIENT_SECRET",
      value: appleClientSecretValue,
      leadingBlank: false,
    });

    envFile.upsertBlock({
      key: "APPLE_APP_BUNDLE_IDENTIFIER",
      value: appleBundleIdentifierValue,
      comment: "# Optional app bundle identifier for native Apple sign-in",
      leadingBlank: false,
    });

    envFile.upsertBlock({
      key: "AUTH_PASSPHRASE_SIGN_IN",
      value: passphraseSignInValue,
      comment:
        "# Passphrase sign-in toggle (true to show the passphrase form in sign-in)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "AUTH_PASSPHRASE_SIGN_UP",
      value: passphraseSignUpValue,
      comment:
        "# Passphrase sign-up toggle (true to allow email + passphrase sign-up)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "AUTH_MAGIC_LINK_SIGN_IN",
      value: magicLinkSignInValue,
      comment: "# Magic link sign-in toggle (true to offer magic link sign-in)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "AUTH_VERIFICATION_CODE_SIGN_IN",
      value: verificationCodeSignInValue,
      comment:
        "# Verification code sign-in toggle (true to offer email verification codes)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "MAIL_CONSOLE_PREVIEW",
      value: mailPreviewValue,
      comment:
        "# Mail preview – when 'true', emails are printed to the dev console instead of being sent",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "RESEND_API_KEY",
      value: resendApiKeyValue,
      comment: "# Resend API key (required when MAIL_CONSOLE_PREVIEW=false)",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "MAIL_FROM",
      value: mailFromValue,
      comment: "# From address used for all outbound mail",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "BRAND_NAME",
      value: brandNameValue,
      comment: "# Brand info for email templates",
      leadingBlank: true,
    });

    envFile.upsertBlock({
      key: "BRAND_LOGO_URL",
      value: brandLogoUrlValue,
      leadingBlank: false,
    });

    envFile.upsertBlock({
      key: "BRAND_TAGLINE",
      value: brandTaglineValue,
      leadingBlank: false,
    });

    const updatedEnv = envFile.toString();
    writeFileSync(ENV_PATH, updatedEnv, "utf8");
    log(`Wrote ${ENV_PATH}`);

    const shellValue = formatForShell(siteUrlForConvex);
    run(`npx convex env set SITE_URL ${shellValue}`);
    run("npx convex dev --once");

    const localSecretAnalysis = analyzeSecretCandidate(
      stripInlineComment(envFile.get(SECRET_ENV_KEY)),
    );
    if (localSecretAnalysis.status === "too_short") {
      log(
        `WARN BETTER_AUTH_SECRET is shorter than ${SECRET_MIN_LENGTH} characters; ignoring local value.`,
      );
    }
    const localSecretValue =
      localSecretAnalysis.status === "valid"
        ? localSecretAnalysis.value
        : undefined;

    const convexSecretAnalysis = analyzeSecretCandidate(
      readConvexEnvValue(SECRET_ENV_KEY),
    );
    if (convexSecretAnalysis.status === "too_short") {
      log(
        `WARN BETTER_AUTH_SECRET stored in Convex env is shorter than ${SECRET_MIN_LENGTH} characters; it will be replaced.`,
      );
    }
    const convexSecretValue =
      convexSecretAnalysis.status === "valid"
        ? convexSecretAnalysis.value
        : undefined;

    if (localSecretValue) {
      if (convexSecretValue) {
        log(
          "BETTER_AUTH_SECRET already configured in Convex env; retaining existing value.",
        );
      } else {
        log("Found BETTER_AUTH_SECRET; storing value in Convex env.");
        setConvexEnvValue(SECRET_ENV_KEY, localSecretValue);
      }
    } else if (convexSecretValue) {
      log(
        "BETTER_AUTH_SECRET already present in Convex env; no new secret generated.",
      );
    } else {
      const generatedSecret = generateSecret();
      log("Generated new BETTER_AUTH_SECRET and storing it in Convex env.");
      setConvexEnvValue(SECRET_ENV_KEY, generatedSecret);
    }

    log("Setup complete.");
  } catch (error) {
    log(`Setup failed: ${sanitizeErrorMessage(error)}`);
    process.exitCode = 1;
  }
}

main();
