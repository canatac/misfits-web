/**
 * Demo mode — when the backend is unreachable or not yet wired, the auth
 * store falls back to these credentials so the UI is fully explorable.
 *
 * This is CLIENT-SIDE ONLY and clearly labelled as demo. No real
 * authentication happens. When BACKEND_URL is available and responds,
 * real auth takes over automatically.
 */

import type { Session, User } from "@/types/auth";

export const DEMO_EMAIL = "demo@misfits.ai";
export const DEMO_PASSWORD = "misfits";

/** Any password works in demo mode, but we advertise DEMO_PASSWORD. */
export function isDemoCredential(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_EMAIL ||
    email.trim().toLowerCase() === "admin@misfits.ai" ||
    password.length > 0 // In demo mode, any non-empty password works
  );
}

export function createDemoSession(email: string): Session {
  const now = Date.now();
  const user: User = {
    id: "demo-user",
    email: email.trim().toLowerCase(),
    displayName: email.split("@")[0] || "Demo User",
    role: "user",
    twoFactorEnabled: false,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  return {
    id: `demo-session-${now}`,
    user,
    accessToken: `demo-token-${now}`,
    refreshToken: `demo-refresh-${now}`,
    expiresAt: now + 60 * 60 * 1000, // 1 hour
    refreshExpiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    issuedAt: now,
  };
}

/**
 * Check if we should use demo mode: when no BACKEND_URL / NEXT_PUBLIC_BACKEND_URL
 * is set, or when the backend is unreachable.
 */
export function shouldUseDemoMode(): boolean {
  // If NEXT_PUBLIC_BACKEND_URL is explicitly set, real mode is intended.
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BACKEND_URL) {
    return false;
  }
  return true;
}
