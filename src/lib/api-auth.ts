/**
 * Auth-specific endpoint helpers.
 *
 * Thin wrappers around {@link apiClient} so the store/hooks stay declarative.
 * Extracted from `api-client.ts` to keep that file focused on the transport
 * layer (fetch, refresh, error parsing). No parent-level imports — this file
 * only depends on `api-client` and shared types.
 */

import { apiClient, getApiBaseUrl } from "@/lib/api-client";
import type {
  AuthApiResponse,
  LoginResponse,
  RefreshSessionResponse,
  Session,
} from "@/types/auth";

export async function apiLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { skipAuth: true }
  );
}

export async function apiRegister(
  first_name: string,
  last_name: string,
  password: string,
  condition_accepted: boolean
): Promise<AuthApiResponse> {
  return apiClient.post<AuthApiResponse>(
    "/auth/register",
    { first_name, last_name, password, condition_accepted },
    { skipAuth: true }
  );
}

export async function apiLogout(): Promise<void> {
  try {
    await apiClient.post<void>("/auth/logout", {});
  } catch {
    // Even if the server call fails we clear locally — best effort.
  }
}

export async function apiVerify2FA(
  challengeId: string,
  code: string
): Promise<AuthApiResponse> {
  return apiClient.post<AuthApiResponse>(
    "/auth/2fa/verify",
    { challengeId, code },
    { skipAuth: true }
  );
}

export async function apiRequestPasswordReset(
  email: string
): Promise<{ requested: boolean }> {
  return apiClient.post<{ requested: boolean }>(
    "/auth/password-reset/request",
    { email },
    { skipAuth: true }
  );
}

export async function apiResetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>(
    "/auth/password-reset/confirm",
    { token, newPassword },
    { skipAuth: true }
  );
}

/** Redirects the browser to the backend to initiate OAuth with GitHub. */
export function initiateGithubLogin(redirectPath?: string): void {
  const safeRedirect =
    redirectPath &&
    redirectPath.startsWith("/") &&
    !redirectPath.startsWith("//")
      ? redirectPath
      : null;

  try {
    if (safeRedirect) {
      document.cookie = `mfa_post_login_redirect=${encodeURIComponent(safeRedirect)}; Path=/; Max-Age=600; SameSite=Lax`;
    }
  } catch {
    // ignore cookie write failures
  }

  const url = new URL(`${getApiBaseUrl()}/auth/oauth/github`);
  if (safeRedirect) {
    url.searchParams.set("redirect", safeRedirect);
  }
  window.location.href = url.toString();
}

/** Used by the store's `refreshSession` action when a manual refresh is needed. */
export async function apiRefresh(refreshToken: string): Promise<Session> {
  const res = await apiClient.post<RefreshSessionResponse>(
    "/auth/refresh",
    { refreshToken },
    { skipAuth: true }
  );
  return res.session;
}
