/**
 * Auth proxy — translates frontend POST /api/auth/login
 * to backend POST /api/auth/login (Rust Warp API).
 *
 * The backend returns snake_case fields; we transform to camelCase
 * so the frontend types (Session, User) are consistent.
 * We also set the mfa_session cookie server-side so the Edge
 * middleware can read it on the next navigation.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8080";

/* ------------------------------------------------------------------ *
 * Snake_case → camelCase transform (lightweight, no deps)
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
 * POST handler
 * ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
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

    // Set mfa_session cookie so the Edge middleware can read it
    response.cookies.set("mfa_session", session.id as string, {
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