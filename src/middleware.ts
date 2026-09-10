/**
 * Next.js Edge middleware — route protection for misfits.ai Mail.
 *
 * Protected routes (/inbox, /mail, /compose, /settings and nested paths) require a
 * valid session cookie (`mfa_session`). Public routes (/, /login, /reset-password
 * and /api/*) are always allowed. The middleware runs on the Edge runtime so it
 * cannot read localStorage — it relies on the httpOnly cookie set by the backend
 * (and mirrored client-side by `src/lib/session.ts`).
 *
 * /api/auth/callback is intentionally public — it is the OAuth redirect target
 * that sets the session before the user reaches any protected route.
 *
 * CORS defense-in-depth (issue #401): validates Origin header for cross-origin
 * API requests to prevent arbitrary origins from making authenticated requests.
 * This is a belt-and-suspenders measure alongside the proxy-level CORS fix.
 */
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/inbox",
  "/mail",
  "/inbox",
  "/compose",
  "/settings",
  "/dashboard",
  "/admin",
  "/monitoring",
  "/security",
];
const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/reset-password",
  "/admin/login",
]);
// Public API routes: auth endpoints + OAuth callback.
// All /api/admin/* are intentionally excluded so they reach
// the Next.js proxy handlers, which forward auth to the backend.
const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/health",
];
const SESSION_COOKIE = "mfa_session";

/**
 * Allowed origins for cross-origin API requests.
 * Only same-origin requests are permitted by default. This prevents arbitrary
 * origins from making authenticated API calls (issue #401).
 */
const ALLOWED_ORIGINS = new Set([
  "https://mail.misfits.ai",
  "http://localhost:3000",
  "http://localhost:3001",
]);

function isProtected(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return false;
  // Admin API routes are NOT blanket-public: they go through proxy-auth.ts
  // which forwards the session token to the backend RBAC guard.
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  // Non-admin API routes (mail, monitoring, etc.) are server-to-server,
  // protected by the backend's own auth layer.
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/admin"))
    return false;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Cross-origin API protection: blocks requests from non-allowed origins.
 * Only enforced for API routes with state-changing methods or auth cookies.
 */
function isCrossOriginAllowed(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  // Only check API routes
  if (!pathname.startsWith("/api")) return true;
  // Same-origin requests are always allowed (no Origin header)
  const origin = request.headers.get("origin");
  if (!origin) return true;
  // Validate against allowlist
  return ALLOWED_ORIGINS.has(origin);
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // CORS defense-in-depth: block cross-origin API requests from non-allowed origins
  if (!isCrossOriginAllowed(request)) {
    return new NextResponse("Forbidden: invalid origin", { status: 403 });
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // No cookie → redirect to login, preserving the intended destination.
  if (!sessionToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static assets and Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
