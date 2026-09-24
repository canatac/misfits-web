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
import { isAllowedOrigin } from "@/lib/cors";

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
  // Public API routes (auth, health) are always allowed.
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  // Admin API routes require session authentication (issue #411).
  // /api/admin/login and /api/admin/whoami are public for OAuth flow.
  if (pathname.startsWith("/api/admin")) {
    const publicAdminRoutes = ["/api/admin/login", "/api/admin/whoami"];
    if (publicAdminRoutes.some((p) => pathname === p || pathname.startsWith(`${p}`)))
      return false;
    return true;
  }
  // Hermes API routes require session (sensitive LLM usage data, issue #411).
  if (pathname.startsWith("/api/hermes")) return true;
  // External accounts API requires session.
  if (pathname.startsWith("/api/external-accounts")) return true;
  // Compose API routes require session (P1 auth gate bypass — issue #1025).
  // /api/compose/* (send, draft, attachments) must always be authenticated.
  // Without this, unauthenticated requests bypass the auth gate and hang
  // waiting for the backend proxy (no fast-fail).
  if (pathname.startsWith("/api/compose")) return true;
  // Email API routes require session (P0 auth bypass regression — issue #730, #729).
  // /api/emails and /api/emails/* (list, get, send, delete, attachments) must
  // always be authenticated. The proxy handler forwards to the backend only
  // after this middleware validates the session cookie.
  if (pathname.startsWith("/api/emails")) return true;
  // Template API routes require session (user-scoped resources — issue #852).
  // /api/templates/* (CRUD) must always be authenticated.
  if (pathname.startsWith("/api/templates")) return true;
  // Mail API routes require session (user-scoped — read receipts, issue #820).
  // /api/mail/* (read-receipts, etc.) must always be authenticated.
  if (pathname.startsWith("/api/mail")) return true;
  // Non-sensitive API routes (monitoring) are server-to-server,
  // protected by the backend's own auth layer.
  if (pathname.startsWith("/api")) return false;
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
  const origin = request.headers.get("origin");

  // CORS defense-in-depth: block cross-origin requests to API routes
  // when the Origin header is not in the allowed list.
  // The primary gate is Caddy; this is a safety net.
  if (origin && !isAllowedOrigin(origin)) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse("Forbidden: origin not allowed", {
        status: 403,
        headers: {
          "Content-Type": "text/plain",
          // Explicitly do NOT echo back the origin or allow credentials
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  // CORS defense-in-depth: block cross-origin API requests from non-allowed origins
  if (!isCrossOriginAllowed(request)) {
    return new NextResponse("Forbidden: invalid origin", { status: 403 });
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // No cookie → redirect to login (UI) or 401 JSON (API).
  if (!sessionToken) {
    // API routes must return 401 JSON, not 307 redirect (issue #1028).
    // RFC 7235: programmatic clients need a proper 401 to detect auth failure.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
