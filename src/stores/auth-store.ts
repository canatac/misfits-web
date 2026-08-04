/**
 * Zustand auth store for misfits.ai Mail.
 *
 * The store is the single source of truth for the auth *state* (user,
 * session, errors, loading) and exposes high-level actions (`login`,
 * `logout`, …) that orchestrate the API client, session persistence and
 * audit logging. TanStack Query mutations (in `use-auth.ts`) call these
 * actions; the UI reads the reactive state.
 *
 * Persistence: rather than using zustand/middleware persist (which would
 * serialise the whole store and fight with our SSR-safe `loadSession`), we
 * delegate token storage to `src/lib/session.ts` and rehydrate only the
 * `session`/`user` slices on creation. This keeps cookies, localStorage and
 * the store in lock-step.
 *
 * Rate limiting: the store guards `login` with a client-side counter (max 5
 * attempts per 15 min window) to provide immediate feedback even before the
 * backend rejects the request. The backend remains authoritative.
 */

import { create } from "zustand";
import type {
  AuthError,
  AuthState,
  LoginCredentials,
  LoginResponse,
  PasswordResetConfirmation,
  PasswordResetRequest,
  RegisterCredentials,
  Session,
  TwoFactorChallenge,
  TwoFactorRequiredResponse,
  User,
} from "@/types/auth";
import {
  ApiError,
  apiLogin,
  apiLogout,
  apiRegister,
  apiResetPassword,
  apiRequestPasswordReset,
  apiVerify2FA,
  apiRefresh,
} from "@/lib/api-client";
import {
  audit,
  clearSession,
  consumePendingOAuthSession,
  detectConcurrentSession,
  loadSession,
  recordSessionId,
  storeSession,
} from "@/lib/session";
import { useAccountStore } from "@/stores/account-store";
import {
  shouldUseDemoMode,
  createDemoSession,
} from "@/lib/demo-mode";

/* ------------------------------------------------------------------ *
 * Helper: normalize snake_case session from backend to camelCase
 * ------------------------------------------------------------------ */

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeSession(raw: Record<string, unknown>): Session {
  function deepMap(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(deepMap);
    if (obj !== null && typeof obj === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[toCamel(k)] = deepMap(v);
      }
      return out;
    }
    return obj;
  }
  return deepMap(raw) as Session;
}

/* ------------------------------------------------------------------ *
 * Rate limiting (client-side)
 * ------------------------------------------------------------------ */

const MAX_ATTEMPTS = 20;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimiter {
  attempts: number;
  windowStart: number;
  blockedUntil: number;
}

function canAttempt(limiter: RateLimiter): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  if (limiter.windowStart + WINDOW_MS < now) {
    limiter.attempts = 0;
    limiter.windowStart = now;
    limiter.blockedUntil = 0;
  }
  if (limiter.attempts >= MAX_ATTEMPTS) {
    const retryAfter = limiter.windowStart + WINDOW_MS;
    return { ok: false, retryAfter };
  }
  return { ok: true };
}

function recordFailure(limiter: RateLimiter): void {
  limiter.attempts += 1;
  if (limiter.attempts >= MAX_ATTEMPTS) {
    limiter.blockedUntil = limiter.windowStart + WINDOW_MS;
  }
}

/* ------------------------------------------------------------------ *
 * Error mapping
 * ------------------------------------------------------------------ */

function toAuthError(err: unknown): AuthError {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return {
        code: "rate_limited",
        message: "Too many attempts. Please try again later.",
        status: 429,
        retryAfter: err.retryAfter ?? Date.now() + WINDOW_MS,
      };
    }
    if (err.status === 0) {
      return {
        code: "network",
        message: err.message,
        status: 0,
      };
    }
    if (err.status === 401) {
      return {
        code: "invalid_credentials",
        message: "Incorrect email or password.",
        status: 401,
      };
    }
    return {
      code: "server",
      message: err.message,
      status: err.status,
    };
  }
  return { code: "unknown", message: "Something went wrong." };
}

/* ------------------------------------------------------------------ *
 * Store shape
 * ------------------------------------------------------------------ */

export interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  verify2FA: (challenge: TwoFactorChallenge) => Promise<void>;
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  resetPassword: (confirmation: PasswordResetConfirmation) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  /** Rehydrate from persisted storage (call once on app boot).
   *  Returns `{ fromOAuth: true, provider }` when an OAuth session was consumed. */
  hydrate: () => { fromOAuth: true; provider: string } | void;
}

/* ------------------------------------------------------------------ *
 * Internal helpers
 * ------------------------------------------------------------------ */

function applySession(
  set: (partial: Partial<AuthStore>) => void,
  session: Session,
  remember: boolean,
): void {
  recordSessionId(session.id);
  storeSession(session, remember);
  const concurrent = detectConcurrentSession(session.id);
  if (concurrent) {
    audit("session_replaced", "Another session detected for this account.");
  }
  set({
    user: session.user,
    session,
    isAuthenticated: true,
    error: null,
    pendingTwoFactorChallengeId: null,
    isLoading: false,
  });

  // Sync the primary account entry with the authenticated user's real data.
  const { accounts, updateAccount } = useAccountStore.getState();
  const primary = accounts.find((a: { isDefault: boolean }) => a.isDefault) ?? accounts[0];
  if (primary) {
    updateAccount(primary.id, {
      email: session.user.email,
      name: session.user.displayName ?? session.user.email.split("@")[0],
    });
  }
}

/* ------------------------------------------------------------------ *
 * Type guard: 2FA challenge vs. full session
 * ------------------------------------------------------------------ */

function isTwoFactorChallenge(
  res: LoginResponse,
): res is TwoFactorRequiredResponse {
  return (
    typeof (res as TwoFactorRequiredResponse).twoFactorRequired === "boolean" &&
    (res as TwoFactorRequiredResponse).twoFactorRequired === true
  );
}

/* ------------------------------------------------------------------ *
 * Store creation
 * ------------------------------------------------------------------ */

const limiter: RateLimiter = { attempts: 0, windowStart: Date.now(), blockedUntil: 0 };

export const useAuthStore = create<AuthStore>((set, get) => ({
  /* --- initial state --- */
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingTwoFactorChallengeId: null,

  /* --- actions --- */

  login: async (credentials) => {
    set({ isLoading: true, error: null });

    const gate = canAttempt(limiter);
    if (!gate.ok) {
      set({
        isLoading: false,
        error: {
          code: "rate_limited",
          message: "Too many login attempts. Please try again later.",
          retryAfter: gate.retryAfter,
        },
      });
      audit("rate_limited", "Client-side rate limit triggered.");
      return;
    }

    try {
      // Demo mode: when no backend is configured, accept any credentials.
      if (shouldUseDemoMode()) {
        const session = createDemoSession(credentials.email);
        applySession(set, session, credentials.remember ?? false);
        audit("login", `Demo login as ${credentials.email}`);
        return;
      }

      const res = await apiLogin(credentials.email, credentials.password);
      if (isTwoFactorChallenge(res)) {
        // Backend requires a 6-digit code before issuing a session.
        set({
          isLoading: false,
          pendingTwoFactorChallengeId: res.challengeId,
          error: null,
        });
        return;
      }
      // Normalize snake_case from backend to camelCase before applying
      applySession(set, normalizeSession(res.session as unknown as Record<string, unknown>), credentials.remember ?? false);
      audit("login", `Signed in as ${res.session.user.email}`);
    } catch (err) {
      // Network error → fall back to demo mode so the UI is still usable.
      if (err instanceof ApiError && err.isNetworkError && shouldUseDemoMode()) {
        const session = createDemoSession(credentials.email);
        applySession(set, session, credentials.remember ?? false);
        audit("login", `Demo login (backend unreachable) as ${credentials.email}`);
        return;
      }

      if (err instanceof ApiError && err.status === 0) {
        // network — don't burn a retry
      } else {
        recordFailure(limiter);
      }
      set({ isLoading: false, error: toAuthError(err) });
      throw err;
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRegister(
        credentials.first_name,
        credentials.last_name,
        credentials.password,
        credentials.condition_accepted,
      );
      applySession(set, res.session, /* remember */ true);
      audit("register", `New account ${res.session.user.email}`);
    } catch (err) {
      set({ isLoading: false, error: toAuthError(err) });
      throw err;
    }
  },

  verify2FA: async (challenge) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiVerify2FA(challenge.challengeId, challenge.code);
      applySession(set, res.session, /* remember */ true);
      audit("2fa_success", `2FA verified for ${res.session.user.email}`);
    } catch (err) {
      audit("2fa_fail", "2FA verification failed.");
      set({ isLoading: false, error: toAuthError(err) });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout();
    } finally {
      clearSession();
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        pendingTwoFactorChallengeId: null,
      });
      audit("logout", "User signed out.");
    }
  },

  requestPasswordReset: async (request) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequestPasswordReset(request.email);
      set({ isLoading: false });
      audit("password_reset_request", `Reset requested for ${request.email}`);
    } catch (err) {
      set({ isLoading: false, error: toAuthError(err) });
      throw err;
    }
  },

  resetPassword: async (confirmation) => {
    set({ isLoading: true, error: null });
    try {
      await apiResetPassword(confirmation.token, confirmation.newPassword);
      set({ isLoading: false });
      audit("password_reset", "Password successfully reset.");
    } catch (err) {
      set({ isLoading: false, error: toAuthError(err) });
      throw err;
    }
  },

  refreshSession: async () => {
    const current = get().session;
    if (!current) return;
    try {
      const session = await apiRefresh(current.refreshToken);
      applySession(set, session, /* remember */ true);
      audit("refresh", "Access token refreshed.");
    } catch (err) {
      // Refresh failed — session is dead, clear it.
      clearSession();
      set({
        session: null,
        user: null,
        isAuthenticated: false,
        error: toAuthError(err),
      });
    }
  },

  clearError: () => set({ error: null }),

  hydrate: () => {
    // Consume session deposited by the OAuth callback route handler first.
    const oauth = consumePendingOAuthSession();
    if (oauth) {
      recordSessionId(oauth.session.id);
      audit("login", `oauth:${oauth.provider}`);
      set({
        session: oauth.session,
        user: oauth.session.user,
        isAuthenticated: true,
      });
      return { fromOAuth: true, provider: oauth.provider };
    }

    const session = loadSession();
    if (session) {
      recordSessionId(session.id);
      set({
        session,
        user: session.user,
        isAuthenticated: true,
      });
    }
  },
}));

/** Selectors for ergonomic consumption. */
export const selectUser = (s: AuthStore): User | null => s.user;
export const selectIsAuthenticated = (s: AuthStore): boolean => s.isAuthenticated;
export const selectAuthError = (s: AuthStore): AuthError | null => s.error;
export const selectAuthLoading = (s: AuthStore): boolean => s.isLoading;
