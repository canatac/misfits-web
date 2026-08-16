import type {
  AuthState,
  LoginCredentials,
  PasswordResetConfirmation,
  PasswordResetRequest,
  RegisterCredentials,
  TwoFactorChallenge,
} from "@/types/auth";

export interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  verify2FA: (challenge: TwoFactorChallenge) => Promise<void>;
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  resetPassword: (confirmation: PasswordResetConfirmation) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  hydrate: () => { fromOAuth: true; provider: string } | void;
}
