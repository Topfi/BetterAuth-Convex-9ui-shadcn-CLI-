import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const log = (message) => console.log(`[update-envs] ${message}`);

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

  get(key) {
    for (let i = this.lines.length - 1; i >= 0; i -= 1) {
      const parsed = this.parseLine(this.lines[i]);
      if (parsed && parsed.key === key) {
        return parsed.value;
      }
    }
    return undefined;
  }
}

function stripInlineComment(value) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  const commentMatch = /^(.*?)\s+#.*$/.exec(trimmed);
  const withoutComment = commentMatch ? commentMatch[1] : trimmed;
  return withoutComment.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
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

function shellEscape(value) {
  if (value === "") {
    return process.platform === "win32" ? '""' : "''";
  }
  if (!/[\s"'`$]/.test(value)) {
    return value;
  }
  if (process.platform === "win32") {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

const readConvexEnvValue = (key) => {
  log(`Checking ${key} in Convex env`);
  try {
    const output = execSync(`npx convex env get ${key}`, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    const trimmed = output.toString("utf8").trim();
    return trimmed;
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

const toComparableValue = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
};

const hasMeaningfulValue = (value) => {
  return toComparableValue(value).trim().length > 0;
};

const describeValueForError = (value) => {
  const comparable = toComparableValue(value);
  const masked = maskPotentialSecret(comparable);
  return masked === "" ? "(empty)" : masked;
};

const syncConvexEnvValue = (key, localValue) => {
  const normalizedLocal = toComparableValue(localValue);
  const remoteValue = readConvexEnvValue(key);
  const normalizedRemote = toComparableValue(remoteValue);

  if (normalizedRemote === normalizedLocal) {
    log(`Skipping ${key}; already in sync.`);
    return;
  }

  const remoteHasMeaningful =
    remoteValue !== undefined && hasMeaningfulValue(remoteValue);
  const localHasMeaningful = hasMeaningfulValue(normalizedLocal);

  if (
    remoteHasMeaningful &&
    localHasMeaningful &&
    normalizedRemote !== normalizedLocal
  ) {
    const conflict = new Error(
      `[env-sync-conflict] ${key} differs between .env.local (${describeValueForError(normalizedLocal)}) and Convex env (${describeValueForError(normalizedRemote)}). Resolve the mismatch and re-run npm run update-envs.`,
    );
    conflict.name = "EnvSyncConflictError";
    throw conflict;
  }

  log(`Updating ${key} in Convex env`);
  try {
    execSync(`npx convex env set ${key} ${shellEscape(normalizedLocal)}`, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
  } catch (error) {
    throw new Error(
      `Failed to set ${key} in Convex env: ${sanitizeErrorMessage(error)}`,
    );
  }
};

function sanitize(value, fallback = "") {
  const stripped = stripInlineComment(value);
  if (stripped === undefined || stripped === null) {
    return fallback;
  }
  return stripped.trim();
}

function main() {
  if (!existsSync(ENV_PATH)) {
    log("Missing .env.local; run npm run setup first.");
    process.exitCode = 1;
    return;
  }

  const envText = readFileSync(ENV_PATH, "utf8");
  const envFile = new EnvFile(envText);

  const siteUrl = sanitize(envFile.get("SITE_URL"), "http://localhost:5173");
  const githubToggleRaw = stripInlineComment(envFile.get("GITHUB_OAUTH"));
  const canonicalGithub = canonicalizeBooleanString(githubToggleRaw);
  const githubToggle = canonicalGithub ?? "false";
  const githubClientId = sanitize(envFile.get("GITHUB_CLIENT_ID"));
  const githubClientSecret = sanitize(envFile.get("GITHUB_CLIENT_SECRET"));
  const googleToggleRaw = stripInlineComment(envFile.get("GOOGLE_OAUTH"));
  const canonicalGoogle = canonicalizeBooleanString(googleToggleRaw);
  const googleToggle = canonicalGoogle ?? "false";
  const googleClientId = sanitize(envFile.get("GOOGLE_CLIENT_ID"));
  const googleClientSecret = sanitize(envFile.get("GOOGLE_CLIENT_SECRET"));
  const appleToggleRaw = stripInlineComment(envFile.get("APPLE_OAUTH"));
  const canonicalApple = canonicalizeBooleanString(appleToggleRaw);
  const appleToggle = canonicalApple ?? "false";
  const appleClientId = sanitize(envFile.get("APPLE_CLIENT_ID"));
  const appleClientSecret = sanitize(envFile.get("APPLE_CLIENT_SECRET"));
  const appleBundleId = sanitize(envFile.get("APPLE_APP_BUNDLE_IDENTIFIER"));
  const mailPreviewRaw = stripInlineComment(
    envFile.get("MAIL_CONSOLE_PREVIEW"),
  );
  const canonicalMailPreview = canonicalizeBooleanString(mailPreviewRaw);
  const mailPreview = canonicalMailPreview ?? "true";
  const resendApiKey = sanitize(envFile.get("RESEND_API_KEY"));
  const mailFrom = sanitize(
    envFile.get("MAIL_FROM"),
    "Test <onboarding@example.com>",
  );
  const brandName = sanitize(envFile.get("BRAND_NAME"));
  const brandLogoUrl = sanitize(envFile.get("BRAND_LOGO_URL"));
  const brandTagline = sanitize(envFile.get("BRAND_TAGLINE"));

  if (githubToggleRaw && canonicalGithub === null) {
    log(
      "WARN GITHUB_OAUTH value is not recognized; defaulting to 'false' for Convex env sync.",
    );
  }

  if (googleToggleRaw && canonicalGoogle === null) {
    log(
      "WARN GOOGLE_OAUTH value is not recognized; defaulting to 'false' for Convex env sync.",
    );
  }

  if (appleToggleRaw && canonicalApple === null) {
    log(
      "WARN APPLE_OAUTH value is not recognized; defaulting to 'false' for Convex env sync.",
    );
  }

  if (mailPreviewRaw && canonicalMailPreview === null) {
    log(
      "WARN MAIL_CONSOLE_PREVIEW value is not recognized; defaulting to 'true' for Convex env sync.",
    );
  }

  syncConvexEnvValue("SITE_URL", siteUrl);
  syncConvexEnvValue("GITHUB_OAUTH", githubToggle);

  if (githubToggle === "true") {
    syncConvexEnvValue("GITHUB_CLIENT_ID", githubClientId);
    syncConvexEnvValue("GITHUB_CLIENT_SECRET", githubClientSecret);
  } else {
    syncConvexEnvValue("GITHUB_CLIENT_ID", "");
    syncConvexEnvValue("GITHUB_CLIENT_SECRET", "");
  }

  syncConvexEnvValue("GOOGLE_OAUTH", googleToggle);

  if (googleToggle === "true") {
    syncConvexEnvValue("GOOGLE_CLIENT_ID", googleClientId);
    syncConvexEnvValue("GOOGLE_CLIENT_SECRET", googleClientSecret);
  } else {
    syncConvexEnvValue("GOOGLE_CLIENT_ID", "");
    syncConvexEnvValue("GOOGLE_CLIENT_SECRET", "");
  }

  syncConvexEnvValue("APPLE_OAUTH", appleToggle);

  if (appleToggle === "true") {
    syncConvexEnvValue("APPLE_CLIENT_ID", appleClientId);
    syncConvexEnvValue("APPLE_CLIENT_SECRET", appleClientSecret);
    syncConvexEnvValue("APPLE_APP_BUNDLE_IDENTIFIER", appleBundleId);
  } else {
    syncConvexEnvValue("APPLE_CLIENT_ID", "");
    syncConvexEnvValue("APPLE_CLIENT_SECRET", "");
    syncConvexEnvValue("APPLE_APP_BUNDLE_IDENTIFIER", "");
  }

  syncConvexEnvValue("MAIL_CONSOLE_PREVIEW", mailPreview);
  syncConvexEnvValue("RESEND_API_KEY", resendApiKey);
  syncConvexEnvValue("MAIL_FROM", mailFrom);
  syncConvexEnvValue("BRAND_NAME", brandName);
  syncConvexEnvValue("BRAND_LOGO_URL", brandLogoUrl);
  syncConvexEnvValue("BRAND_TAGLINE", brandTagline);

  const localSecretAnalysis = analyzeSecretCandidate(
    stripInlineComment(envFile.get(SECRET_ENV_KEY)),
  );
  if (localSecretAnalysis.status === "valid") {
    syncConvexEnvValue(SECRET_ENV_KEY, localSecretAnalysis.value);
  } else if (localSecretAnalysis.status === "too_short") {
    log(
      `WARN BETTER_AUTH_SECRET in .env.local is shorter than ${SECRET_MIN_LENGTH} characters; skipping Convex sync.`,
    );
  }

  log("Env sync complete.");
}

try {
  main();
} catch (error) {
  log(`Sync failed: ${sanitizeErrorMessage(error)}`);
  process.exitCode = 1;
}
