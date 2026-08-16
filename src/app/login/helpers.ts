const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidLoginId(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.includes("@")) return EMAIL_RE.test(v);
  return /^[A-Za-z0-9._+-]{1,64}$/.test(v);
}

export function isRateLimited(retryAfter?: number): boolean {
  return Boolean(retryAfter && retryAfter > Date.now());
}

export function formatRetry(retryAfter?: number): string {
  if (!retryAfter) return "a few minutes";
  const secs = Math.max(0, Math.ceil((retryAfter - Date.now()) / 1000));
  if (secs < 60) return `${secs}s`;
  return `${Math.ceil(secs / 60)}m`;
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Social login failed. Please try again.",
  oauth_cancelled:
    "Login was cancelled. You can try again or use your email and password.",
};

export function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return (
    OAUTH_ERROR_MESSAGES[code] ?? "Something went wrong. Please try again."
  );
}
