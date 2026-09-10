/**
 * CORS configuration for misfits.ai Mail.
 *
 * Production origins whitelist. Any Origin header not in this list
 * will be rejected at the middleware level (defense-in-depth).
 *
 * The primary CORS gate is the reverse proxy (Caddy). This list
 * mirrors the Caddy cors directive for defense-in-depth.
 */

const ALLOWED_ORIGINS = new Set([
  "https://mail.misfits.ai",
  "https://www.mail.misfits.ai",
]);

// Localhost origins allowed only in non-production
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
  ALLOWED_ORIGINS.add("http://localhost:3001");
  ALLOWED_ORIGINS.add("http://127.0.0.1:3000");
  ALLOWED_ORIGINS.add("http://127.0.0.1:3001");
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

export function getAllowedOrigins(): string[] {
  return Array.from(ALLOWED_ORIGINS);
}
