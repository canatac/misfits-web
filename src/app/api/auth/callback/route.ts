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
 *  3. Sets a short-lived `mfa_oauth_pending` cookie (readable by JS) so the
 *     client-side auth store can persist the full session to localStorage on
 *     the next render.
 *  4. Redirects the user to `/mail`.
 *
 * If no `session` param is present but the backend already set the
 * `mfa_session` cookie directly, this handler simply redirects to `/mail`.
 *
 * On any failure the user is redirected to `/login?error=oauth_failed`.
 */

import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ *
 * snake_case → camelCase normalisation (mirrors auth-store.ts)
 * ------------------------------------------------------------------ */

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function normalizeSession(raw: Record<string, unknown>): Session {
  function deepMap(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(deepMap);
    if (obj !== null && typeof obj === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        out[toCamel(k)] = deepMap(v);
      }
      return out;
    }
    return obj;
  }
  return deepMap(raw) as Session;
}

/* ------------------------------------------------------------------ *
 * GET /api/auth/callback
 * ------------------------------------------------------------------ */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const sessionParam = searchParams.get("session");
  const provider = searchParams.get("provider") ?? "unknown";
  const errorParam = searchParams.get("error");
  const isSecure = req.nextUrl.protocol === "https:";

  // ── Case 0: Backend / OAuth provider returned an error ──
  if (!sessionParam && errorParam) {
    // Propagate recognisable error codes; fall back to oauth_failed.
    const code =
      errorParam === "access_denied" ? "oauth_cancelled" : "oauth_failed";
    return NextResponse.redirect(
      new URL(`/login?error=${code}`, req.url),
    );
  }

  // ── Case 1: Backend passed the full session as a base64-encoded JSON param ──
  if (sessionParam) {
    try {
      const decoded = Buffer.from(sessionParam, "base64").toString("utf-8");
      const raw = JSON.parse(decoded) as Record<string, unknown>;
      const session = normalizeSession(raw);

      if (!session.id || !session.accessToken) {
        throw new Error("Invalid session: missing required fields.");
      }

      const rfa =
        typeof session.refreshExpiresAt === "number"
          ? session.refreshExpiresAt
          : Date.now() + 86_400_000;
      const ttlSeconds = Math.max(60, Math.round((rfa - Date.now()) / 1000));

      const pendingPayload = JSON.stringify({ session, provider });

      const res = NextResponse.redirect(new URL("/mail", req.url));

      // httpOnly session cookie — read by Edge middleware for route protection.
      res.cookies.set("mfa_session", session.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: ttlSeconds,
        secure: isSecure,
      });

      // Short-lived client-readable cookie — consumed by the auth store's
      // hydrate() to persist the full session to localStorage.
      res.cookies.set("mfa_oauth_pending", pendingPayload, {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60,
        secure: isSecure,
      });

      return res;
    } catch {
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", req.url),
      );
    }
  }

  // ── Case 2: Backend already set the mfa_session cookie — just redirect ──
  if (req.cookies.get("mfa_session")) {
    return NextResponse.redirect(new URL("/mail", req.url));
  }

  // ── Case 3: Nothing to work with — send back to login ──
  return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
}
