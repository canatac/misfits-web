/**
 * Session audit log — append-only ring buffer of auth events kept in
 * localStorage so the Settings → Sessions view can render recent activity
 * without a network call.
 *
 * Extracted from `session.ts` to keep that file focused on token storage.
 * This module has no dependency on the rest of the session layer.
 */

const AUDIT_KEY = "mfa.audit";

/** Max audit entries kept in localStorage (ring buffer). */
const AUDIT_MAX = 50;

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

export type AuditEventType =
  | "login"
  | "logout"
  | "register"
  | "refresh"
  | "2fa_success"
  | "2fa_fail"
  | "password_reset_request"
  | "password_reset"
  | "session_replaced"
  | "rate_limited";

export interface AuditEntry {
  id: string;
  type: AuditEventType;
  at: number;
  /** IP / device hint when known. */
  origin?: string;
  /** Free-form detail, never secrets. */
  detail?: string;
}

export function audit(
  type: AuditEventType,
  detail?: string,
  origin?: string
): AuditEntry {
  const entry: AuditEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    at: Date.now(),
    origin,
    detail,
  };
  if (isBrowser()) {
    try {
      const existing = readAuditLog();
      const next = [entry, ...existing].slice(0, AUDIT_MAX);
      localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  return entry;
}

export function readAuditLog(): AuditEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearAuditLog(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(AUDIT_KEY);
  } catch {
    // ignore
  }
}
