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
 * for first-party requests (preferred, immune to JS exfiltration). On the
 * client we keep the full session in memory only (tab process scope) so
 * access/refresh tokens are never written to browser storage.
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

const SESSION_COOKIE = "mfa_session";
let inMemorySession: Session | null = null;
let inMemoryLastSessionId: string | null = null;

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

/** Persist the session in memory and (optionally) a cookie. */
export function storeSession(session: Session, remember: boolean): void {
  if (!isBrowser()) return;
  void remember;
  inMemorySession = session;
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

  // The cookie is httpOnly-preferred when set by the backend; this client-side
  // copy is a fallback for environments where the backend cannot set cookies.
  // Always set the cookie so the Edge middleware can read it regardless of
  // whether "Remember me" was checked.
  if (ttlSeconds > 0) {
    setCookie(SESSION_COOKIE, session.id, ttlSeconds);
  }
}

/** Read the in-memory session. */
export function loadSession(): Session | null {
  const session = inMemorySession;
  if (!session) {
    return null;
  }
  if (session.refreshExpiresAt <= Date.now()) {
    clearSession();
    return null;
  }
  return session;
}

/** Remove the session from memory and cookie. */
export function clearSession(): void {
  if (!isBrowser()) return;
  inMemorySession = null;
  inMemoryLastSessionId = null;
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

export function recordSessionId(id: string): void {
  inMemoryLastSessionId = id;
}

export function detectConcurrentSession(currentId: string): boolean {
  const known = inMemoryLastSessionId;
  return known !== null && known !== currentId;
}

/** Re-exported for middleware/tests that only need the cookie name. */
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const hasSessionCookie = (): boolean =>
  readCookie(SESSION_COOKIE) !== null;

/* ------------------------------------------------------------------ *
 * OAuth session handoff
 *
 * The server-side OAuth callback route handler cannot access sessionStorage,
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
