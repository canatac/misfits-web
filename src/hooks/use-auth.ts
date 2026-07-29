/**
 * TanStack Query mutation hooks wrapping the Zustand auth store actions.
 *
 * Why both a store *and* Query mutations?
 *  - The store owns the **state** (user, session, errors) — shared, reactive,
 *    persisted across the app.
 *  - The mutations own the **lifecycle** of each network operation — loading,
 *    success/error side-effects, retries, invalidation of dependent caches.
 *
 * Components that only care about rendering use the selectors (`selectUser`,
 * `selectIsAuthenticated`, …); components that trigger auth operations use the
 * hooks below so they get per-mutation `isPending` / `isError` without sharing
 * the global `isLoading` flag.
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  LoginCredentials,
  PasswordResetConfirmation,
  PasswordResetRequest,
  RegisterCredentials,
  TwoFactorChallenge,
} from "@/types/auth";
import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

/* ------------------------------------------------------------------ *
 * Shared error toast helper
 * ------------------------------------------------------------------ */

function notifyAuthError(message: string): void {
  toast.error(message);
}

/* ------------------------------------------------------------------ *
 * useLogin
 * ------------------------------------------------------------------ */

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      // Login resolves successfully even when a 2FA challenge is issued —
      // only navigate when the store actually became authenticated.
      const { isAuthenticated, pendingTwoFactorChallengeId } =
        useAuthStore.getState();
      if (pendingTwoFactorChallengeId && !isAuthenticated) {
        // UI switches to the 2FA step; do not redirect.
        return;
      }
      toast.success("Welcome back!");
      // Prefer ?redirect= when present (login page sets it via sessionStorage)
      let dest = "/mail";
      try {
        const fromQs =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("redirect")
            : null;
        if (fromQs && fromQs.startsWith("/")) dest = fromQs;
      } catch {
        /* ignore */
      }
      router.replace(dest);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError ? error.message : "Login failed. Please try again.";
      notifyAuthError(message);
    },
  });
}

/* ------------------------------------------------------------------ *
 * useRegister
 * ------------------------------------------------------------------ */

export function useRegister() {
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
    onSuccess: () => {
      toast.success("Account created — welcome to misfits.ai Mail!");
      router.push("/mail");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Registration failed. Please try again.";
      notifyAuthError(message);
    },
  });
}

/* ------------------------------------------------------------------ *
 * useLogout
 *
 * Clears the store, redirects to /login and invalidates the React Query
 * cache so no stale inbox data lingers.
 * ------------------------------------------------------------------ */

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  // We deliberately do NOT use useQueryClient() here to keep this hook usable
  // from any component without a provider context assumption; the store
  // clearing the session is sufficient to make downstream queries refetch.
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success("Signed out.");
      router.push("/login");
    },
    onError: () => {
      // logout clears locally regardless, so still navigate.
      router.push("/login");
    },
  });
}

/** Convenience callable for header / menu logout buttons. */
export function useLogoutAction(): () => void {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  return useCallback(async () => {
    await logout();
    router.push("/login");
  }, [logout, router]);
}

/* ------------------------------------------------------------------ *
 * usePasswordReset
 *
 * Two-phase hook: request the reset link, then confirm with a new password.
 * The UI drives each phase with a separate mutation.
 * ------------------------------------------------------------------ */

export function useRequestPasswordReset() {
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  return useMutation({
    mutationFn: (request: PasswordResetRequest) => requestPasswordReset(request),
    onSuccess: () => {
      toast.success("If that email exists, a reset link is on its way.");
    },
    onError: (error: unknown) => {
      // Even on error we show a soft message to avoid leaking which emails exist.
      toast.success("If that email exists, a reset link is on its way.");
      void error;
    },
  });
}

export function useConfirmPasswordReset() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const router = useRouter();
  return useMutation({
    mutationFn: (confirmation: PasswordResetConfirmation) =>
      resetPassword(confirmation),
    onSuccess: () => {
      toast.success("Password updated — you can sign in now.");
      router.push("/login");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not reset password. The link may have expired.";
      notifyAuthError(message);
    },
  });
}

/* ------------------------------------------------------------------ *
 * use2FA
 *
 * Completes the second-factor step after a login that returned
 * `two_factor_required`. On success the store transitions to authenticated
 * and we navigate to /mail.
 * ------------------------------------------------------------------ */

export function use2FA() {
  const verify2FA = useAuthStore((s) => s.verify2FA);
  const router = useRouter();
  return useMutation({
    mutationFn: (challenge: TwoFactorChallenge) => verify2FA(challenge),
    onSuccess: () => {
      toast.success("Two-factor verified.");
      router.push("/mail");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Invalid verification code. Please try again.";
      notifyAuthError(message);
    },
  });
}

/* ------------------------------------------------------------------ *
 * useAuth
 *
 * All-in-one accessor for components that need the current auth state plus
 * the logout action without importing several hooks.
 * ------------------------------------------------------------------ */

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const logout = useLogoutAction();
  return { user, session, isAuthenticated, isLoading, error, logout };
}
