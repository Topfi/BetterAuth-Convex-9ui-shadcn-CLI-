import { z } from "zod";

export type NormalizedUsername = {
  /** Lowercase value stored in Convex and used for comparisons */
  lower: string;
  /** Display-cased value shown in the UI */
  display: string;
};

export type IdentityPreviewSample = {
  username: string;
  email: string;
};

export const identityPreviewSamples = [
  { username: "AdaLovelace", email: "ada.lovelace@example.com" },
  { username: "AlanTuring", email: "alan.turing@example.com" },
  { username: "GraceHopper", email: "grace.hopper@example.com" },
  { username: "DonaldKnuth", email: "donald.knuth@example.com" },
  { username: "EdsgerDijkstra", email: "edsger.dijkstra@example.com" },
  { username: "MargaretHamilton", email: "margaret.hamilton@example.com" },
  { username: "KatherineJohnson", email: "katherine.johnson@example.com" },
  { username: "BarbaraLiskov", email: "barbara.liskov@example.com" },
  { username: "JohnVonNeumann", email: "john.vonneumann@example.com" },
] satisfies readonly IdentityPreviewSample[];

export const pickIdentityPreviewSample = (
  random: () => number = Math.random,
): IdentityPreviewSample => {
  const total = identityPreviewSamples.length;
  if (total === 0) {
    throw new Error("No identity preview samples configured.");
  }
  const raw = random();
  const candidateIndex = Math.floor(raw * total);
  if (Number.isFinite(candidateIndex)) {
    const clampedIndex = Math.min(Math.max(candidateIndex, 0), total - 1);
    return identityPreviewSamples[clampedIndex];
  }
  return identityPreviewSamples[0];
};

export const USERNAME_TAKEN_ERROR = "That username is taken. Try another.";
export const AUTOCLAIM_FAILURE_MESSAGE =
  "Could not assign a username automatically. Please choose one.";

const USERNAME_DISPLAY_REGEX = /^[A-Za-z0-9]{3,32}$/;
const USERNAME_LOWER_REGEX = /^[a-z0-9]{3,32}$/;
const EMAIL_SCHEMA = z.string().email();

export const PENDING_IDENTITY_TTL_MS = 24 * 60 * 60 * 1000;

export const emailSchema = EMAIL_SCHEMA;

export const normalizeEmail = (value: string) => {
  const parsed = EMAIL_SCHEMA.parse(value.trim());
  return {
    original: parsed,
    lower: parsed.toLowerCase(),
  } as const;
};

export const usernameDisplaySchema = z
  .string()
  .trim()
  .regex(USERNAME_DISPLAY_REGEX, "Use only letters and digits (3–32).");

export const usernameLowerSchema = z
  .string()
  .trim()
  .regex(USERNAME_LOWER_REGEX, "Invalid username.");

export const normalizeUsername = (display: string): NormalizedUsername => {
  const parsedDisplay = usernameDisplaySchema.parse(display);
  const lower = usernameLowerSchema.parse(parsedDisplay.toLowerCase());
  return { lower, display: parsedDisplay } satisfies NormalizedUsername;
};

export const usernameFromEmail = (email: string): NormalizedUsername => {
  const parsedEmail = EMAIL_SCHEMA.parse(email);
  const localPart = parsedEmail.split("@")[0] ?? "";
  const basePart = localPart.split("+")[0] ?? localPart;
  const stripped = basePart.replace(/[^A-Za-z0-9]/g, "");
  const candidate = stripped.length >= 3 ? stripped : "user";
  return normalizeUsername(candidate);
};

const BASE64_IMAGE_MAX_LENGTH = 7_000_000; // ~5 MB binary payload allowance

export const pendingIdentityInputSchema = z.object({
  betterAuthUserId: z.string().min(1, "Missing Better Auth user identifier."),
  email: EMAIL_SCHEMA,
  username: usernameDisplaySchema,
  imageBase64: z
    .string()
    .trim()
    .max(BASE64_IMAGE_MAX_LENGTH, "Profile image must be 5 MB or smaller.")
    .optional(),
});

export type PendingIdentityInput = z.infer<typeof pendingIdentityInputSchema>;

export const pendingIdentityRecordSchema = z.object({
  betterAuthUserId: z.string(),
  email: EMAIL_SCHEMA,
  emailLower: z.string(),
  usernameLower: usernameLowerSchema,
  usernameDisplay: usernameDisplaySchema,
  imageBase64: z
    .string()
    .max(BASE64_IMAGE_MAX_LENGTH, "Profile image must be 5 MB or smaller.")
    .optional(),
  expiresAt: z.number().nonnegative(),
  createdAt: z.number().nonnegative(),
});

export type PendingIdentityRecord = z.infer<typeof pendingIdentityRecordSchema>;

export const computePendingIdentityExpiration = (now: number) =>
  now + PENDING_IDENTITY_TTL_MS;

export const buildPendingIdentityRecord = (
  input: PendingIdentityInput,
  now: number = Date.now(),
): PendingIdentityRecord => {
  const { original: email, lower: emailLower } = normalizeEmail(input.email);
  const normalizedUsername = normalizeUsername(input.username);
  const imageBase64 = input.imageBase64;

  return {
    betterAuthUserId: input.betterAuthUserId,
    email,
    emailLower,
    usernameLower: normalizedUsername.lower,
    usernameDisplay: normalizedUsername.display,
    imageBase64: imageBase64 ?? undefined,
    createdAt: now,
    expiresAt: computePendingIdentityExpiration(now),
  } satisfies PendingIdentityRecord;
};
