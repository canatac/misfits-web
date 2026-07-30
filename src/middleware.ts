/**
 * Next.js Edge middleware — route protection for misfits.ai Mail.
 *
 * Protected routes (/inbox, /compose, /settings and nested paths) require a
 * valid session cookie (`mfa_session`). Public routes (/, /login, /reset-password
 * and /api/*) are always allowed. The middleware runs on the Edge runtime so it
 * cannot read localStorage — it relies on the httpOnly cookie set by the backend
 * (and mirrored client-side by `src/lib/session.ts`).
 *
 * /api/auth/callback is intentionally public — it is the OAuth redirect target
 * that sets the session before the user reaches any protected route.
 */

import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/mail", "/compose", "/settings"];
const PUBLIC_EXACT = new Set(["/", "/login", "/reset-password"]);
const SESSION_COOKIE = "mfa_session";

function isProtected(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return false;
  if (pathname.startsWith("/api")) return false;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // No cookie → redirect to login, preserving the intended destination.
  if (!sessionToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};