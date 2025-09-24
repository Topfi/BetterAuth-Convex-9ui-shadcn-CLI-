const protocolRegex = /https?:\/\//i;

const leadingOrTrailingQuotes = /^['"]+|['"]+$/g;

const allowedLocalHostname = "localhost";

function isAcceptableHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === allowedLocalHostname) return true;
  return normalized.includes(".");
}

/**
 * Normalize misformatted URLs received from auth mail hooks so that
 * email templates always embed a clickable link.
 */
export function normalizeMailUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error("Unable to normalize mail URL: value is empty");
  }

  // Remove immediate wrapping quotes and stray escape characters.
  let candidate = trimmed
    .replace(/\\r|\\n|\\t/g, "")
    .replace(leadingOrTrailingQuotes, "")
    .replace(/\\"/g, "")
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "");

  // If protocol appears later in the string, discard any prefix noise.
  const protocolIndex = candidate.search(protocolRegex);
  if (protocolIndex > 0) {
    candidate = candidate.slice(protocolIndex);
  }

  // Remove any lingering quotes after the protocol trimming.
  candidate = candidate.replace(/"/g, "");

  // Repair common protocol duplication artifacts.
  candidate = candidate
    .replace(/^https:\/\/https?:\/\//i, "https://")
    .replace(/^http:\/\/https?:\/\//i, "http://")
    .replace(/^https:\/\/https\/?/i, "https://")
    .replace(/^http:\/\/http\/?/i, "http://");

  // Ensure we have a protocol before parsing.
  if (!protocolRegex.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      isAcceptableHostname(url.hostname)
    ) {
      return url.toString();
    }
  } catch {
    // Try to salvage the first URL-like token in the string.
    const fallbackMatch = candidate.match(/https?:\/\/\S+/i);
    if (fallbackMatch) {
      try {
        const fallbackUrl = new URL(fallbackMatch[0]);
        if (
          (fallbackUrl.protocol === "http:" ||
            fallbackUrl.protocol === "https:") &&
          isAcceptableHostname(fallbackUrl.hostname)
        ) {
          return fallbackUrl.toString();
        }
      } catch {
        // fall through to error below
      }
    }
  }

  throw new Error(
    `Unable to normalize mail URL from input: ${JSON.stringify(rawUrl)}`,
  );
}
