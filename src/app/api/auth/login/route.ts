/**
 * Auth proxy — translates frontend POST /api/auth/login
 * to backend GET /login/:username/:password (Rust Warp API).
 *
 * Frontend sends: POST /api/auth/login { email, password }
 * We call backend: GET BACKEND_URL/login/:username/:password
 * We return: { session: { id, user, accessToken, ... } }
 *
 * This normalizes the backend's JWT-only response into the Session
 * shape the frontend auth store expects.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 }
      );
    }

    // Extract username from email (backend uses username, not email)
    const username = email.includes("@") ? email.split("@")[0] : email;

    // Call backend: GET /login/:username/:password
    const res = await fetch(
      `${BACKEND_URL}/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Backend returns a JWT string — wrap it in a Session object
    const token = await res.text();
    const now = Date.now();

    const session = {
      id: `session-${now}`,
      user: {
        id: username,
        email: email,
        displayName: username,
        role: "user",
        twoFactorEnabled: false,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      },
      accessToken: token.replace(/"/g, ""), // Remove surrounding quotes from JSON string
      refreshToken: token.replace(/"/g, ""),
      expiresAt: now + 60 * 60 * 1000,
      refreshExpiresAt: now + 7 * 24 * 60 * 60 * 1000,
      issuedAt: now,
    };

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json(
      { message: "Backend unreachable" },
      { status: 503 }
    );
  }
}
