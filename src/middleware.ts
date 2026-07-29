/**
 * Next.js Edge middleware — route protection + auth proxy for misfits.ai Mail.
 *
 * Protected routes (/mail, /compose, /settings and nested paths) require a
 * valid session cookie (`mfa_session`). Public routes (/, /login, /reset-password
 * and /api/*) are always allowed.
 *
 * The middleware also handles POST /api/auth/login before the rewrite proxy
 * can intercept it, transforming the backend's snake_case response to camelCase
 * and setting the mfa_session cookie.
 */

import { NextResponse, type NextRequest } from "next/server";

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

const PROTECTED_PREFIXES = ["/mail", "/compose", "/settings"];
const PUBLIC_EXACT = new Set(["/", "/login", "/reset-password"]);
const SESSION_COOKIE = "mfa_session";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8080";

/* ------------------------------------------------------------------ *
 * Snake_case → camelCase transform (Edge-safe, no deps)
 * ------------------------------------------------------------------ */

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function deepToCamel<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(deepToCamel) as T;
  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[toCamel(k)] = deepToCamel(v);
    }
    return out as T;
  }
  return obj as T;
}

/* ------------------------------------------------------------------ *
 * Route protection
 * ------------------------------------------------------------------ */

function isProtected(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return false;
  if (pathname.startsWith("/api")) return false;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/* ------------------------------------------------------------------ *
 * Login handler (runs before the rewrite proxy)
 * ------------------------------------------------------------------ */

async function handleLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 },
      );
    }

    // Call backend: POST /api/auth/login
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Invalid credentials" }));
      return NextResponse.json(
        { message: err.message || "Invalid credentials" },
        { status: res.status },
      );
    }

    // Backend returns snake_case JSON — transform to camelCase
    const raw = await res.json();
    const transformed = deepToCamel<{ session: Record<string, unknown> }>(raw);
    const session = transformed.session;

    const now = Date.now();
    const ttlSeconds = Math.max(
      0,
      Math.round(((session.refreshExpiresAt as number) - now) / 1000),
    );

    const response = NextResponse.json({ session });

    // Set mfa_session cookie so subsequent requests pass the middleware
    response.cookies.set(SESSION_COOKIE, session.id as string, {
      httpOnly: false,
      maxAge: ttlSeconds,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Backend unreachable" },
      { status: 503 },
    );
  }
}

/* ------------------------------------------------------------------ *
 * Main middleware
 * ------------------------------------------------------------------ */

export async function middleware(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Handle login requests before the rewrite proxy
  if (pathname === "/api/auth/login" && request.method === "POST") {
    return handleLogin(request);
  }

  // Route protection
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

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

export const config = {
  // Match all routes except static assets and Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};