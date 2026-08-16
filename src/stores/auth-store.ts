/**
 * Zustand auth store for misfits.ai Mail.
 * See docs in ./auth-store/* for helpers.
 */

import { create } from "zustand";
import type { AuthError, User } from "@/types/auth";
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
  loadSession,
  recordSessionId,
} from "@/lib/session";
import { shouldUseDemoMode, createDemoSession } from "@/lib/demo-mode";
import { normalizeSession } from "./auth-store/normalize";
import {
  canAttempt,
  recordFailure,
  toAuthError,
  type RateLimiter,
} from "./auth-store/rate-limit";
import { applySession, isTwoFactorChallenge } from "./auth-store/apply-session";
import type { AuthStore } from "./auth-store/types";

export type { AuthStore } from "./auth-store/types";

const limiter: RateLimiter = {
  attempts: 0,
  windowStart: Date.now(),
  blockedUntil: 0,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  pendingTwoFactorChallengeId: null,

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
      if (shouldUseDemoMode()) {
        const session = createDemoSession(credentials.email);
        applySession(set, session, credentials.remember ?? false);
        audit("login", `Demo login as ${credentials.email}`);
        return;
      }

      const res = await apiLogin(credentials.email, credentials.password);
      if (isTwoFactorChallenge(res)) {
        set({
          isLoading: false,
          pendingTwoFactorChallengeId: res.challengeId,
          error: null,
        });
        return;
      }
      applySession(
        set,
        normalizeSession(res.session as unknown as Record<string, unknown>),
        credentials.remember ?? false
      );
      audit("login", `Signed in as ${res.session.user.email}`);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.isNetworkError &&
        shouldUseDemoMode()
      ) {
        const session = createDemoSession(credentials.email);
        applySession(set, session, credentials.remember ?? false);
        audit(
          "login",
          `Demo login (backend unreachable) as ${credentials.email}`
        );
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
        credentials.condition_accepted
      );
      applySession(set, res.session, true);
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
      applySession(set, res.session, true);
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
      applySession(set, session, true);
      audit("refresh", "Access token refreshed.");
    } catch (err) {
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
    const oauth = consumePendingOAuthSession();
    if (oauth) {
      audit("login", `oauth:${oauth.provider}`);
      applySession(set, oauth.session, true);
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

export const selectUser = (s: AuthStore): User | null => s.user;
export const selectIsAuthenticated = (s: AuthStore): boolean =>
  s.isAuthenticated;
export const selectAuthError = (s: AuthStore): AuthError | null => s.error;
export const selectAuthLoading = (s: AuthStore): boolean => s.isLoading;
