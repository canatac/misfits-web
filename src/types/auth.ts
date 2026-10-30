export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Session {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
  issuedAt: number;
  user: User;
}

export interface AuthError {
  code: string;
  message: string;
  retryAfter?: number;
}

export interface TwoFactorChallenge {
  challengeId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}
