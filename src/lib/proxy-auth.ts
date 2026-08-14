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
  headers.set("Accept", "application/json");
  const { authorization, cookie } = extractIncomingAuth(request);
  if (authorization) headers.set("Authorization", authorization);
  if (cookie) headers.set("Cookie", cookie);
  return headers;
}
