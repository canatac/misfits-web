/**
 * Authentication & session domain types for misfits.ai Mail.
 *
 * These types describe the shape of the data exchanged between the frontend
 * auth store, the API client, the Rust backend (Warp) and the UI layer.
 * They are intentionally framework-agnostic — no React/Zustand/Query types
 * leak here so the domain model can be reused on the server (middleware,
 * server components) if needed.
 */

/* ------------------------------------------------------------------ *
 * User
 * ------------------------------------------------------------------ */

export type UserRole = "user" | "admin" | "support";

export interface User {
  id: string;
  email: string;
  /** Display name shown in the UI (optional — derived from email if absent). */
  displayName?: string;
  /** Avatar URL (optional — may be a Gravatar or uploaded asset). */
  avatarUrl?: string;
  role: UserRole;
  /** Whether the user has completed the second-factor setup. */
  twoFactorEnabled: boolean;
  /** ISO-8601 timestamps from the backend. */
  createdAt: string;
  updatedAt: string;
  /** Last successful login (ISO-8601), used for "sessions" UI. */
  lastLoginAt?: string;
}

/* ------------------------------------------------------------------ *
 * Session
 * ------------------------------------------------------------------ */

export interface Session {
  /** Opaque session id issued by the backend. */
  id: string;
  /** The authenticated user. */
  user: User;
  /** Short-lived access token (JWT or opaque). Sent as `Authorization: Bearer`. */
  accessToken: string;
  /** Long-lived refresh token used to obtain new access tokens. */
  refreshToken: string;
  /** Absolute expiry of the access token (epoch ms). */
  expiresAt: number;
  /** Absolute expiry of the refresh token (epoch ms). */
  refreshExpiresAt: number;
  /** When the session was created (epoch ms). */
  issuedAt: number;
  /** Where the session originated (IP / user-agent summary). */
  origin?: string;
}

/* ------------------------------------------------------------------ *
 * Credentials
 * ------------------------------------------------------------------ */

export interface LoginCredentials {
  email: string;
  password: string;
  /** Persist session beyond browser close when true. */
  remember?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  /** Optional display name captured at sign-up. */
  displayName?: string;
  /** Must be accepted to create an account. */
  acceptTerms: boolean;
}

/** Body for the second-factor verification step. */
export interface TwoFactorChallenge {
  /** 6-digit TOTP code, or backup code. */
  code: string;
  /** The session id awaiting 2FA (returned by login when 2FA is required). */
  challengeId: string;
}

/* ------------------------------------------------------------------ *
 * Password reset
 * ------------------------------------------------------------------ */

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmation {
  /** Token delivered out-of-band (email link). */
  token: string;
  newPassword: string;
}

/* ------------------------------------------------------------------ *
 * Auth state (Zustand store slice)
 * ------------------------------------------------------------------ */

export type AuthErrorCode =
  | "invalid_credentials"
  | "rate_limited"
  | "two_factor_required"
  | "network"
  | "server"
  | "unknown";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  /** HTTP status if the error originated from a response. */
  status?: number;
  /** When the rate-limit window resets (epoch ms) — only set for `rate_limited`. */
  retryAfter?: number;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  /**
   * When login returns `two_factor_required`, the challenge id is stored here
   * so the UI can render the 6-digit step and the store can complete it.
   */
  pendingTwoFactorChallengeId: string | null;
}

/* ------------------------------------------------------------------ *
 * API response shapes (mirrors the Rust backend contract)
 * ------------------------------------------------------------------ */

export interface AuthApiResponse {
  session: Session;
}

export interface TwoFactorRequiredResponse {
  /** Discriminator — `true` means the backend needs a 2FA code before issuing a session. */
  twoFactorRequired: true;
  challengeId: string;
  /** Seconds before the challenge expires. */
  expiresIn: number;
}

/** Login endpoint returns either a session (success) or a 2FA challenge. */
export type LoginResponse = AuthApiResponse | TwoFactorRequiredResponse;

export interface PasswordResetRequestResponse {
  /** Always `true` to avoid leaking which emails are registered. */
  requested: boolean;
}

export interface RefreshSessionResponse {
  session: Session;
}
