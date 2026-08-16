/**
 * Session management utilities for misfits.ai Mail.
 *
 * Responsible for the *mechanics* of auth tokens — where they are stored,
 * when they expire, and how we record audit events — without knowing anything
 * about React, Zustand or the API client. This keeps the auth store focused
 * on state transitions and lets the API client / middleware read tokens from
 * a single source of truth.
 *
 * Storage strategy: the backend should set an HttpOnly `mfa_session` cookie
 * for first-party requests (preferred, immune to JS exfiltration). We also keep
 * a localStorage mirror so client-only navigation, the Zustand store and the
 * TanStack Query mutations can read the access/refresh tokens without a round
 * trip. The localStorage copy is namespaced and expunged on logout.
 */

import type { Session } from "@/types/auth";

// Audit log lives in a sibling module to keep this file focused.
export {
  audit,
  readAuditLog,
  clearAuditLog,
  type AuditEntry,
  type AuditEventType,
} from "./session-audit";

/* ------------------------------------------------------------------ *
 * Storage keys
 * ------------------------------------------------------------------ */

const STORAGE_KEY = "mfa.session";
const SESSION_COOKIE = "mfa_session";

/* ------------------------------------------------------------------ *
 * Cookie helpers (browser-only, SSR-safe)
 * ------------------------------------------------------------------ */

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

function clearCookie(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/* ------------------------------------------------------------------ *
 * Token storage
 * ------------------------------------------------------------------ */

interface PersistedSession {
  session: Session;
  /** epoch ms — when the persisted entry was written. */
  storedAt: number;
}

/** Persist the session to localStorage and (optionally) a cookie. */
export function storeSession(session: Session, remember: boolean): void {
  if (!isBrowser()) return;
  const payload: PersistedSession = { session, storedAt: Date.now() };
  const rfa =
    (session as unknown as Record<string, unknown>).refreshExpiresAt ??
    (session as unknown as Record<string, unknown>).refresh_expires_at;
  const ttlSeconds = Math.max(
    0,
    Math.round(
      ((typeof rfa === "number" ? rfa : Date.now() + 86_400_000) - Date.now()) /
        1000
    )
  );

  try {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // localStorage may be unavailable (private mode, quota) — fail soft.
  }

  // The cookie is httpOnly-preferred when set by the backend; this client-side
  // copy is a fallback for environments where the backend cannot set cookies.
  // Always set the cookie so the Edge middleware can read it regardless of
  // whether "Remember me" was checked.
  if (ttlSeconds > 0) {
    setCookie(SESSION_COOKIE, session.id, ttlSeconds);
  }
}

/** Read the persisted session, preferring session storage, then localStorage. */
export function loadSession(): Session | null {
  if (!isBrowser()) return null;
  try {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed?.session) return null;
    // Refresh token expired? Drop it.
    if (parsed.session.refreshExpiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return parsed.session;
  } catch {
    return null;
  }
}

/** Remove the session from every storage location. */
export function clearSession(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  clearCookie(SESSION_COOKIE);
}

/** The bearer token for `Authorization` headers, or null when unauthenticated. */
export function getAccessToken(): string | null {
  const session = loadSession();
  return session?.accessToken ?? null;
}

/** The refresh token used by the API client to renew an expired access token. */
export function getRefreshToken(): string | null {
  const session = loadSession();
  return session?.refreshToken ?? null;
}

/* ------------------------------------------------------------------ *
 * Expiry checks
 * ------------------------------------------------------------------ */

/** True when the access token is still valid (with optional skew). */
export function isAccessTokenValid(
  session: Session | null,
  skewMs = 0
): boolean {
  if (!session) return false;
  return session.expiresAt - skewMs > Date.now();
}

/** True when the refresh token is still valid (session is still renewable). */
export function isRefreshTokenValid(session: Session | null): boolean {
  if (!session) return false;
  return session.refreshExpiresAt > Date.now();
}

/** Human-readable remaining time for the access token (e.g. "4m 12s"). */
export function formatExpiry(session: Session | null): string {
  if (!session) return "expired";
  const ms = Math.max(0, session.expiresAt - Date.now());
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/* ------------------------------------------------------------------ *
 * Concurrent-session detection (stub)
 *
 * The backend will eventually emit a "session.replaced" event when a second
 * login invalidates the first. Until that channel exists we record every
 * session id we observe and surface a mismatch if another tab stores a
 * different id — a pragmatic, client-side heuristic only.
 * ------------------------------------------------------------------ */

const LAST_SESSION_ID_KEY = "mfa.lastSessionId";

export function recordSessionId(id: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(LAST_SESSION_ID_KEY, id);
  } catch {
    // ignore
  }
}

export function detectConcurrentSession(currentId: string): boolean {
  if (!isBrowser()) return false;
  try {
    const known = localStorage.getItem(LAST_SESSION_ID_KEY);
    return known !== null && known !== currentId;
  } catch {
    return false;
  }
}

/** Re-exported for middleware/tests that only need the cookie name. */
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const hasSessionCookie = (): boolean =>
  readCookie(SESSION_COOKIE) !== null;

/* ------------------------------------------------------------------ *
 * OAuth session handoff
 *
 * The server-side OAuth callback route handler cannot access localStorage,
 * so it writes the full session JSON into a short-lived client-readable
 * cookie (`mfa_oauth_pending`). This function reads that cookie once on the
 * first client render, persists the session normally, then clears the cookie.
 * ------------------------------------------------------------------ */

const OAUTH_PENDING_COOKIE = "mfa_oauth_pending";

export interface PendingOAuthSession {
  session: Session;
  provider: string;
}

/**
 * Reads the `mfa_oauth_pending` cookie written by the OAuth callback route
 * handler, persists the session via `storeSession`, clears the handoff
 * cookie, and returns `{ session, provider }`. Returns `null` when no
 * pending handoff is present.
 */
export function consumePendingOAuthSession(): PendingOAuthSession | null {
  if (!isBrowser()) return null;
  const raw = readCookie(OAUTH_PENDING_COOKIE);
  if (!raw) return null;
  // Clear immediately so it cannot be read a second time.
  clearCookie(OAUTH_PENDING_COOKIE);
  try {
    const data = JSON.parse(raw) as PendingOAuthSession;
    if (!data?.session?.id) return null;
    storeSession(data.session, /* remember */ true);
    return data;
  } catch {
    return null;
  }
}
