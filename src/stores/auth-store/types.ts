import type { AuthError, User } from "@/types/auth";

export interface AuthState {
  user: User | null;
  session: unknown;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  pendingTwoFactorChallengeId: string | null;
  twoFactorEnabled: boolean;
}

export interface TwoFactorChallenge {
  challengeId: string;
  code: string;
}

export interface AuthStore extends AuthState {
  login: (credentials: { email: string; password: string; remember?: boolean }) => Promise<void>;
  register: (credentials: {
    first_name: string;
    last_name: string;
    password: string;
    condition_accepted: boolean;
  }) => Promise<void>;
  verify2FA: (challenge: TwoFactorChallenge) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (request: { email: string }) => Promise<void>;
  resetPassword: (confirmation: { token: string; newPassword: string }) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  hydrate: () => Promise<{ fromOAuth: boolean; provider: string } | void>;
}
