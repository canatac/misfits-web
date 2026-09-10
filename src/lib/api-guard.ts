/**
 * Authentication guard for Next.js API routes.
 *
 * Extracts the session token from the incoming request and returns 401
 * if no valid session is present. Used by proxy routes that forward
 * to the Rust backend.
 *
 * Token sources (priority order):
 *   1. `mfa_session` cookie (set on login, httpOnly)
 *   2. `session_token` cookie (RBAC-native)
 *   3. `Authorization: Bearer *** header (client-side injected)
 */

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["mfa_session", "session_token"] as const;

export function getSessionToken(request: NextRequest): string | null {
  // Check cookies first (works in Next.js runtime)
  const cookies = request.cookies as unknown as { get?: (name: string) => { value?: string } | undefined } | undefined;
  if (cookies?.get) {
    for (const name of SESSION_COOKIES) {
      const token = cookies.get(name)?.value;
      if (token) return token;
    }
  }

  // Fallback: parse raw Cookie header (for test environments)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    for (const name of SESSION_COOKIES) {
      const match = cookieHeader.match(
        new RegExp(`(?:^|[\\s;])${name}=([^;]+)`)
      );
      if (match) return decodeURIComponent(match[1].trim());
    }
  }

  // Fall back to Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function requireAuth(
  request: NextRequest
): { token: string } | { response: NextResponse } {
  const token = getSessionToken(request);
  if (!token) {
    return {
      response: NextResponse.json(
        { error: { message: "Authentication required" } },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer realm="misfits.ai"',
          },
        }
      ),
    };
  }
  return { token };
}
