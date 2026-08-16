import { ApiError } from "@/lib/api-client";
import type { AuthError } from "@/types/auth";

export const MAX_ATTEMPTS = 20;
export const WINDOW_MS = 5 * 60 * 1000;

export interface RateLimiter {
  attempts: number;
  windowStart: number;
  blockedUntil: number;
}

export function canAttempt(limiter: RateLimiter): {
  ok: boolean;
  retryAfter?: number;
} {
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

export function recordFailure(limiter: RateLimiter): void {
  limiter.attempts += 1;
  if (limiter.attempts >= MAX_ATTEMPTS) {
    limiter.blockedUntil = limiter.windowStart + WINDOW_MS;
  }
}

export function toAuthError(err: unknown): AuthError {
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
      return { code: "network", message: err.message, status: 0 };
    }
    if (err.status === 401) {
      return {
        code: "invalid_credentials",
        message: "Incorrect email or password.",
        status: 401,
      };
    }
    return { code: "server", message: err.message, status: err.status };
  }
  return { code: "unknown", message: "Something went wrong." };
}
