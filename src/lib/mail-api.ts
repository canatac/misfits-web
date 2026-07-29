/**
 * Shared helpers for mail API calls (Phase A5).
 * user_id for Mongo is the local-part (e.g. `admin`), not the full email.
 */
import { getAccessToken, loadSession } from "@/lib/session";

/** Prefer local-part of the authenticated user email. */
export function getMailUserId(): string {
  const session = loadSession();
  const email = session?.user?.email?.trim();
  if (email) {
    return email.includes("@") ? email.split("@")[0]! : email;
  }
  return "admin";
}

/** Headers for authenticated mail I/O against email_api. */
export function mailAuthHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-user-id": getMailUserId(),
    ...extra,
  };
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
