/**
 * Demo mode — when the backend is unreachable, the auth store falls back
 * to a local demo session so the UI is still explorable.
 *
 * The frontend always tries real auth first (via the /api proxy).
 * Demo mode only activates on network failure.
 */

import type { Session, User } from "@/types/auth";

export const DEMO_EMAIL = "demo@misfits.ai";
export const DEMO_PASSWORD = "misfits";

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
    expiresAt: now + 60 * 60 * 1000,
    refreshExpiresAt: now + 7 * 24 * 60 * 60 * 1000,
    issuedAt: now,
  };
}

/**
 * Demo mode is determined at runtime by trying the real backend first.
 * This function is called as a fallback when the API call fails.
 */
export function shouldUseDemoMode(): boolean {
  // In production with a backend, the /api proxy works — no demo needed.
  // Demo mode is only a fallback for network errors.
  return false;
}
