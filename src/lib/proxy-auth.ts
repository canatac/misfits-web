/**
 * Auth-forwarding helpers for Next.js API routes proxying the Rust backend.
 *
 * Historically our /api/admin/* routes forwarded only the JSON body and
 * dropped every authentication signal. The backend (reimagined-guide, PR1)
 * now expects `Authorization: Bearer <token>` (or the `session_token` cookie)
 * whenever `ADMIN_RBAC_ENFORCE=1` is set. This module centralises the
 * "grab the token from the incoming Next request and hand it to the backend"
 * plumbing so every proxy stays consistent.
 *
 * Sources of a token, in priority order:
 *   1. The incoming request's `Authorization: Bearer ...` header
 *      (misfits-web's client injects this from localStorage).
 *   2. The `mfa_session` cookie (set on login).
 *   3. The `session_token` cookie (RBAC-native cookie set by future flows).
 *
 * A missing token is *not* an error here: PR1 keeps the flag OFF by default
 * so the backend answers 200 regardless. The proxy therefore forwards what
 * it has and lets the backend decide.
 */

/**
 * Resolve the backend base URL for proxy routes.
 *
 * Default matches the internal Docker service name (email-api:8000),
 * NOT the public internet URL. Using the public URL from inside the
 * container causes fetch failures (DNS/timeout → 500) because the
 * internal services are only reachable via the Docker bridge network.
 *
 * Matches the default in next.config.ts rewrites.
 *
 * Fallback chain when DNS resolution of `email-api` fails (container not
 * attached to mailnet bridge — see issue #866):
 *   1. BACKEND_URL env var (explicit override)
 *   2. http://email-api:8000 (Docker DNS, normal case)
 *   3. http://host.docker.internal:8000 (Linux Docker host gateway)
 *   4. http://localhost:8000 (last resort / dev mode)
 */
export function resolveBackendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "http://email-api:8000"
      : "http://localhost:8000");
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/**
 * Ordered list of backend base URLs to try when the primary fails.
 * Used by proxy routes that need resilience against Docker DNS failures.
 */
export function resolveBackendBaseUrlCandidates(): string[] {
  const primary = resolveBackendBaseUrl();
  const candidates = [primary];
  if (process.env.NODE_ENV === "production") {
    // Fallback URLs when Docker service DNS doesn't resolve
    if (!primary.includes("host.docker.internal")) {
      candidates.push("http://host.docker.internal:8000");
    }
    if (!primary.includes("localhost")) {
      candidates.push("http://localhost:8000");
    }
  }
  return candidates;
}

export function extractIncomingAuth(request: Request): {
  authorization?: string;
  cookie?: string;
} {
  const authorization = request.headers.get("authorization") ?? undefined;
  const cookie = request.headers.get("cookie") ?? undefined;
  return { authorization, cookie };
}

export function buildForwardHeaders(
  request: Request,
  extra?: HeadersInit
): Headers {
  const headers = new Headers(extra ?? {});
  // Only set default Accept if not already provided in extra headers
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const { authorization, cookie } = extractIncomingAuth(request);
  if (authorization) headers.set("Authorization", authorization);
  if (cookie) headers.set("Cookie", cookie);
  // Forward the user identity headers injected client-side by apiClient
  // (`x-user-id`, `x-user-email`). Backend handlers use these to scope
  // per-user resources (external IMAP accounts, drafts, etc.); dropping
  // them causes silent 404s when the backend falls back to the SMTP_USERNAME
  // default and a follow-up request looks up the resource with a different id.
  const uid = request.headers.get("x-user-id");
  const uemail = request.headers.get("x-user-email");
  if (uid) headers.set("x-user-id", uid);
  if (uemail) headers.set("x-user-email", uemail);
  return headers;
}
