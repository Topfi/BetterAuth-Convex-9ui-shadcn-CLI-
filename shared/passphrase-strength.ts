import { zxcvbn } from "@zxcvbn-ts/core";

export type PassphraseRejectionReason = "score_too_low" | "contains_metadata";

export interface PassphraseFeedback {
  warning?: string;
  suggestions: string[];
}

export interface PassphraseEvaluation {
  score: number;
  acceptable: boolean;
  reason?: PassphraseRejectionReason;
  feedback: PassphraseFeedback;
  normalizedInputs: string[];
}

export interface PassphraseEvaluationOptions {
  passphrase: string;
  metadata?: Array<string | null | undefined>;
  minimumScore?: number;
}

export const DEFAULT_MINIMUM_PASSPHRASE_SCORE = 3;
export const COMPROMISED_PASSPHRASE_MESSAGE =
  "This passphrase already surfaced in breach data. Pick something unique.";

const PASSPHRASE_REJECTION_MESSAGES: Record<PassphraseRejectionReason, string> =
  {
    score_too_low: "Choose a stronger passphrase before continuing.",
    contains_metadata:
      "Remove references to your email, username, or other personal details.",
  };

const SCORE_LABELS = [
  "very weak",
  "weak",
  "fair",
  "strong",
  "excellent",
] as const;

const MINIMUM_METADATA_SUBSTRING_LENGTH = 4;
const MINIMUM_PART_LENGTH_FOR_DICTIONARY = 4;

const sanitizeMetadata = (
  metadata: Array<string | null | undefined>,
): string[] => {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const raw of metadata) {
    if (!raw) {
      continue;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }

    const lowered = trimmed.toLowerCase();
    if (!seen.has(lowered)) {
      seen.add(lowered);
      normalized.push(lowered);
    }

    const parts = lowered
      .split(/[\s@._-]+/u)
      .map((part) => part.trim())
      .filter((part) => part.length >= MINIMUM_PART_LENGTH_FOR_DICTIONARY);

    for (const part of parts) {
      if (part === lowered) {
        continue;
      }
      if (!seen.has(part)) {
        seen.add(part);
        normalized.push(part);
      }
    }
  }

  return normalized;
};

export class PassphraseValidationError extends Error {
  public readonly reason: PassphraseRejectionReason;
  public readonly evaluation: PassphraseEvaluation;

  constructor(
    reason: PassphraseRejectionReason,
    evaluation: PassphraseEvaluation,
    message = PASSPHRASE_REJECTION_MESSAGES[reason],
  ) {
    super(message);
    this.reason = reason;
    this.evaluation = evaluation;
  }
}

export const getPassphraseStrengthLabel = (score: number): string => {
  const index = Math.min(
    SCORE_LABELS.length - 1,
    Math.max(0, Math.trunc(score)),
  );
  return SCORE_LABELS[index];
};

export function evaluatePassphraseStrength({
  passphrase,
  metadata = [],
  minimumScore = DEFAULT_MINIMUM_PASSPHRASE_SCORE,
}: PassphraseEvaluationOptions): PassphraseEvaluation {
  const normalizedInputs = sanitizeMetadata(metadata);
  const passphraseLower = passphrase.toLowerCase();

  const containsMetadata = normalizedInputs.some(
    (input) =>
      input.length >= MINIMUM_METADATA_SUBSTRING_LENGTH &&
      passphraseLower.includes(input),
  );

  const result = zxcvbn(passphrase, normalizedInputs);

  const acceptable =
    result.score >= minimumScore &&
    containsMetadata === false &&
    passphrase.length > 0;

  const reason: PassphraseRejectionReason | undefined = acceptable
    ? undefined
    : containsMetadata
      ? "contains_metadata"
      : "score_too_low";

  return {
    score: result.score,
    acceptable,
    reason,
    normalizedInputs,
    feedback: {
      warning: result.feedback.warning ?? undefined,
      suggestions: result.feedback.suggestions ?? [],
    },
  } satisfies PassphraseEvaluation;
}

export function assertAcceptablePassphrase(
  options: PassphraseEvaluationOptions,
): PassphraseEvaluation {
  const evaluation = evaluatePassphraseStrength(options);

  if (!evaluation.acceptable) {
    const reason = evaluation.reason ?? "score_too_low";
    throw new PassphraseValidationError(reason, evaluation);
  }

  return evaluation;
}
