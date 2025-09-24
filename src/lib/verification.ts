export function resolveVerificationSuccessUrl() {
  const baseUrl =
    import.meta.env.VITE_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  try {
    return new URL("/auth/verification-success", baseUrl).toString();
  } catch {
    return "/auth/verification-success";
  }
}
