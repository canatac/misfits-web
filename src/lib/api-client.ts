/**
 * Thin `fetch` wrapper used by every data hook and the auth store.
 *
 * Responsibilities:
 *  - inject `Authorization: Bearer *** when a session is present,
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

import type { RefreshSessionResponse } from "@/types/auth";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  loadSession,
  storeSession,
} from "@/lib/session";
import { ApiError, parseResponse } from "@/lib/api-client-errors";

export { ApiError } from "@/lib/api-client-errors";
export type { ApiErrorBody } from "@/lib/api-client-errors";

/* ------------------------------------------------------------------ *
 * Configuration
 * ------------------------------------------------------------------ */

/** Same-origin proxy by default; overridable via env for SSR. */
const BASE_URL =
  (typeof process !== "undefined" && process.env?.BACKEND_URL) || "/api";

/** Public accessor for the resolved API base URL (used by helpers). */
export function getApiBaseUrl(): string {
  return BASE_URL;
}

/** Single-flight refresh: avoid stampeding the refresh endpoint. */
let refreshPromise: Promise<string | null> | null = null;

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
  opts: RequestOptions = {}
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
    // Mail API wants local-part user id (Mongo user_id convention).
    const session = loadSession();
    const email = session?.user?.email?.trim();
    if (email) {
      finalHeaders.set("x-user-email", email);
      finalHeaders.set(
        "x-user-id",
        email.includes("@") ? email.split("@")[0]! : email
      );
    }
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
 * Convenience verbs
 * ------------------------------------------------------------------ */

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, "GET", opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, "POST", { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, "PUT", { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, "PATCH", { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, "DELETE", opts),
};
