/**
 * Session management utilities for misfits.ai Mail.
 *
 * Responsible for the *mechanics* of auth tokens — where they are stored,
 * when they expire, and how we record audit events — without knowing anything
 * about React, Zustand or the API client. This keeps the auth store focused
 * on state transitions and lets the API client / middleware read tokens from
 * a single source of truth.
 *
 * Storage strategy: the full session stays in memory only. The browser cookie
 * stores at most an opaque session handle so a hard refresh can rehydrate from
 * the backend without ever persisting access/refresh tokens in JS-readable
 * storage.
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

  // Store full session in cookie so it survives page refresh.
  // The cookie is httpOnly-preferred when set by the backend; this client-side
  // copy is a fallback for environments where the backend cannot set cookies.
  if (ttlSeconds > 0) {
    setCookie(SESSION_COOKIE, JSON.stringify(session), ttlSeconds);
  }
}

/** Read the in-memory session. */
export function loadSession(): Session | null {
  const session = inMemorySession;
  if (session) {
    if (session.refreshExpiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  }

  // Try to restore from cookie when in-memory session is lost (page refresh)
  const raw = readCookie(SESSION_COOKIE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Session;
      if (parsed?.id && parsed.refreshExpiresAt > Date.now()) {
        inMemorySession = parsed;
        return parsed;
      }
    } catch {
      // Invalid cookie, clear it
      clearCookie(SESSION_COOKIE);
    }
  }

  return null;
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
 * OAuth handoff
 *
 * The server-side OAuth callback route handler writes a short-lived,
 * non-sensitive provider marker cookie so the client knows to rehydrate once
 * after the redirect. The full session is still fetched from the backend.
 * ------------------------------------------------------------------ */

const OAUTH_PROVIDER_COOKIE = "mfa_oauth_provider";

export function consumePendingOAuthProvider(): string | null {
  if (!isBrowser()) return null;
  const raw = readCookie(OAUTH_PROVIDER_COOKIE);
  if (!raw) return null;
  clearCookie(OAUTH_PROVIDER_COOKIE);
  return /^[a-z0-9_-]{1,32}$/i.test(raw) ? raw : null;
}
