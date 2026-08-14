/**
 * Shared helpers for mail API calls (Phase A5).
 * user_id for Mongo is the local-part (e.g. `admin`), not the full email.
 */
import { getAccessToken, loadSession } from "@/lib/session";

/** Prefer local-part of the authenticated user email. */
export function getMailUserId(): string | null {
  const session = loadSession();
  const email = session?.user?.email?.trim();
  if (!email) return null;
  return email.includes("@") ? email.split("@")[0]! : email;
}

export function hasMailIdentity(): boolean {
  const session = loadSession();
  return Boolean(session?.user?.email?.trim());
}

/** Headers for authenticated mail I/O against email_api. */
export function mailAuthHeaders(
  extra?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const userId = getMailUserId();
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const session = loadSession();
  if (session?.user?.email) {
    headers["x-user-email"] = session.user.email;
  }
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
