/**
 * Thin `fetch` wrapper used by every data hook and the auth store.
 *
 * Responsibilities:
 *  - inject `Authorization: Bearer <accessToken>` when a session is present,
 *  - transparently refresh the access token (once) on `401` using the
 *    refresh token, then replay the original request,
 *  - parse JSON errors into a consistent `ApiError` shape,
 *  - surface network failures distinctly from server failures.
 *
 * The base URL resolves to the Next.js rewrite proxy (`/api`) by default, so
 * browser requests stay same-origin and benefit from the httpOnly session
 * cookie set by the backend. `BACKEND_URL` is honoured for server-side usage
 * (RSC / middleware / route handlers) where the proxy is not available.
 */

import type {
  AuthApiResponse,
  LoginResponse,
  RefreshSessionResponse,
  Session,
} from "@/types/auth";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  storeSession,
} from "@/lib/session";

/* ------------------------------------------------------------------ *
 * Configuration
 * ------------------------------------------------------------------ */

/** Same-origin proxy by default; overridable via env for SSR. */
const BASE_URL =
  (typeof process !== "undefined" && process.env?.BACKEND_URL) || "/api";

/** Single-flight refresh: avoid stampeding the refresh endpoint. */
let refreshPromise: Promise<string | null> | null = null;

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

export interface ApiErrorBody {
  /** Machine-readable error code (mirrors backend). */
  code?: string;
  message: string;
  /** When the rate-limit window resets (epoch ms). */
  retryAfter?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfter?: number;
  readonly body?: unknown;

  constructor(
    status: number,
    message: string,
    opts?: { code?: string; retryAfter?: number; body?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts?.code;
    this.retryAfter = opts?.retryAfter;
    this.body = opts?.body;
  }

  /** Convenience: was the error caused by network unavailability? */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/* ------------------------------------------------------------------ *
 * Refresh logic
 * ------------------------------------------------------------------ */

/**
 * Exchange the refresh token for a new session. Returns the new access token
 * or null if no refresh was possible. Concurrent callers share the same
 * promise (single-flight) so we never issue parallel refresh requests.
 */
export async function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) clearSession();
        return null;
      }
      const data = (await res.json()) as RefreshSessionResponse;
      storeSession(data.session, /* remember */ true);
      return data.session.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/* ------------------------------------------------------------------ *
 * Core request function
 * ------------------------------------------------------------------ */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serialisable body (will be stringified; sets Content-Type). */
  body?: unknown;
  /** Skip auth injection for public endpoints (e.g. /auth/login). */
  skipAuth?: boolean;
  /** Override the base URL (rarely needed). */
  baseUrl?: string;
}

async function request<T>(
  path: string,
  method: HttpMethod,
  opts: RequestOptions = {},
): Promise<T> {
  const { body, headers, skipAuth, baseUrl, ...rest } = opts;
  const url = `${baseUrl ?? BASE_URL}${path}`;

  const finalHeaders = new Headers(headers);
  if (body !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const init: RequestInit = {
    method,
    headers: finalHeaders,
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(0, "Network error — unable to reach the server.", {
      code: "network",
    });
  }

  // 401 → try one refresh, then replay.
  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshSession();
    if (newToken) {
      finalHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryInit: RequestInit = { ...init, headers: finalHeaders };
      try {
        response = await fetch(url, retryInit);
      } catch {
        throw new ApiError(0, "Network error — unable to reach the server.", {
          code: "network",
        });
      }
    }
  }

  return parseResponse<T>(response);
}

/* ------------------------------------------------------------------ *
 * Response parsing
 * ------------------------------------------------------------------ */

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";

  if (response.ok) {
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    // Non-JSON success (e.g. text) — coerce to text typed as T.
    return (await response.text()) as unknown as T;
  }

  // Error path
  if (contentType.includes("application/json")) {
    let body: ApiErrorBody;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = { message: response.statusText };
    }
    const retryAfter = response.headers.get("retry-after");
    throw new ApiError(response.status, body.message ?? response.statusText, {
      code: body.code,
      retryAfter:
        body.retryAfter ??
        (retryAfter ? Number(retryAfter) * 1000 + Date.now() : undefined),
      body,
    });
  }

  throw new ApiError(response.status, response.statusText || "Request failed");
}

/* ------------------------------------------------------------------ *
 * Convenience verbs
 * ------------------------------------------------------------------ */

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, "GET", opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, "POST", { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, "PUT", { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, "PATCH", { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, "DELETE", opts),
};

/* ------------------------------------------------------------------ *
 * Auth-specific endpoint helpers
 * (Thin wrappers around apiClient so the store/hooks stay declarative.)
 * ------------------------------------------------------------------ */

export async function apiLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { skipAuth: true, baseUrl: "" },
  );
}

export async function apiRegister(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthApiResponse> {
  return apiClient.post<AuthApiResponse>(
    "/auth/register",
    { email, password, displayName },
    { skipAuth: true },
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
  code: string,
): Promise<AuthApiResponse> {
  return apiClient.post<AuthApiResponse>(
    "/auth/2fa/verify",
    { challengeId, code },
    { skipAuth: true },
  );
}

export async function apiRequestPasswordReset(
  email: string,
): Promise<{ requested: boolean }> {
  return apiClient.post<{ requested: boolean }>(
    "/auth/password-reset/request",
    { email },
    { skipAuth: true },
  );
}

export async function apiResetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>(
    "/auth/password-reset/confirm",
    { token, newPassword },
    { skipAuth: true },
  );
}

/** Used by the store's `refreshSession` action when a manual refresh is needed. */
export async function apiRefresh(refreshToken: string): Promise<Session> {
  const res = await apiClient.post<RefreshSessionResponse>(
    "/auth/refresh",
    { refreshToken },
    { skipAuth: true },
  );
  return res.session;
}
