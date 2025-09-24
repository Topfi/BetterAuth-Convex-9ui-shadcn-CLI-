import { toast } from "@/lib/toast";

const RETRY_HEADER = "X-Retry-After";

export const handleRateLimitResponse = async (
  response: Response,
): Promise<boolean> => {
  if (response.status !== 429) {
    return false;
  }

  const retryAfterRaw = response.headers.get(RETRY_HEADER);
  const retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : NaN;

  const description =
    Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? `Try again in ${retryAfterSeconds} seconds.`
      : "Too many requests. Please try again shortly.";

  toast.warning({
    title: "Too many attempts",
    description,
  });

  return true;
};
