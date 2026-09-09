/**
 * OAuth callback route handler for misfits.ai Mail.
 *
 * The backend performs the OAuth dance and then redirects
 * the browser here:
 *
 *   /api/auth/callback?session=<base64_json>&provider=github
 *
 * This handler:
 *  1. Decodes and validates the session from the `session` query parameter.
 *  2. Sets the `mfa_session` cookie (httpOnly) so the Edge middleware grants
 *     access to protected routes.
 *  3. Sets a short-lived non-sensitive provider marker cookie so the
 *     client-side auth store can rehydrate the full session from the backend
 *     on the next render.
 *  4. Redirects the user to `/dashboard`.
 *
 * If no `session` param is present but the backend already set the
 * `mfa_session` cookie directly, this handler simply redirects to `/dashboard`.
 *
 * On any failure the user is redirected to `/login?error=oauth_failed`.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseSession } from "@/lib/session-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ *
 * GET /api/auth/callback
 * ------------------------------------------------------------------ */

function resolveRedirectPath(req: NextRequest): string {
  const fromQuery = req.nextUrl.searchParams.get("redirect");
  const fromCookieRaw = req.cookies.get("mfa_post_login_redirect")?.value;
  let fromCookie: string | null = null;
  if (fromCookieRaw) {
    try {
      fromCookie = decodeURIComponent(fromCookieRaw);
    } catch {
      fromCookie = fromCookieRaw;
    }
  }
  const raw = fromQuery ?? fromCookie ?? "/dashboard";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const sessionParam = searchParams.get("session");
  const provider = searchParams.get("provider") ?? "unknown";
  const errorParam = searchParams.get("error");
  const isSecure = req.nextUrl.protocol === "https:";
  const redirectPath = resolveRedirectPath(req);

  // ── Case 0: Backend / OAuth provider returned an error ──
  if (!sessionParam && errorParam) {
    // Propagate recognisable error codes; fall back to oauth_failed.
    const code =
      errorParam === "access_denied" ? "oauth_cancelled" : "oauth_failed";
    return NextResponse.redirect(new URL(`/login?error=${code}`, req.url));
  }

  // ── Case 1: Backend passed the full session as a base64-encoded JSON param ──
  if (sessionParam) {
    try {
      const decoded = Buffer.from(sessionParam, "base64").toString("utf-8");
      const session = parseSession(JSON.parse(decoded) as unknown);
      if (!session) {
        throw new Error("Invalid session: missing required fields.");
      }

      const rfa =
        typeof session.refreshExpiresAt === "number"
          ? session.refreshExpiresAt
          : Date.now() + 86_400_000;
      const ttlSeconds = Math.max(60, Math.round((rfa - Date.now()) / 1000));

      const res = NextResponse.redirect(new URL(redirectPath, req.url));

      // httpOnly session cookie — read by Edge middleware for route protection.
      res.cookies.set("mfa_session", session.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: ttlSeconds,
        secure: isSecure,
      });

      // Short-lived client-readable marker — tells the auth store to
      // rehydrate the full session from the backend once after redirect.
      res.cookies.set("mfa_oauth_provider", provider, {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60,
        secure: isSecure,
      });

      // Cleanup transient redirect hint cookie.
      res.cookies.set("mfa_post_login_redirect", "", {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: isSecure,
      });

      return res;
    } catch {
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", req.url)
      );
    }
  }

  // ── Case 2: Backend already set the mfa_session cookie — just redirect ──
  if (req.cookies.get("mfa_session")) {
    const res = NextResponse.redirect(new URL(redirectPath, req.url));
    res.cookies.set("mfa_oauth_provider", provider, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60,
      secure: isSecure,
    });
    res.cookies.set("mfa_post_login_redirect", "", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: isSecure,
    });
    return res;
  }

  // ── Case 3: Nothing to work with — send back to login ──
  return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
}
