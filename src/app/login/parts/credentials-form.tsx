import { useState } from "react";

import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";

type CredentialsFormProps = {
  email: string;
  setEmail: (value: string) => void;
  emailError: boolean;
  setEmailTouched: () => void;
  password: string;
  setPassword: (value: string) => void;
  remember: boolean;
  setRemember: (value: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
  loginPending: boolean;
  rateLimited: boolean;
  retryAfter: number | undefined;
  invalidCredentials: boolean;
  oauthPending: string | null;
  onGithub: () => void;
};

export function CredentialsForm(props: CredentialsFormProps) {
  const {
    email,
    setEmail,
    emailError,
    setEmailTouched,
    password,
    setPassword,
    remember,
    setRemember,
    onSubmit,
    submitting,
    loginPending,
    rateLimited,
    retryAfter,
    invalidCredentials,
    oauthPending,
    onGithub,
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-md border px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched()}
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "email-error" : undefined}
          required
        />
        {emailError ? (
          <p id="email-error" className="text-xs text-[var(--color-danger-500)]">
            Enter a valid email address.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="w-full rounded-md border px-3 py-2 pr-16 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={invalidCredentials ? "true" : "false"}
            aria-describedby={
              invalidCredentials ? "password-error" : "password-help"
            }
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <PasswordStrengthIndicator password={password} />
        <p id="password-help" className="text-xs" aria-live="polite">
          {password.length === 0
            ? "Password is empty."
            : `${password.length} characters entered.`}
        </p>
        {invalidCredentials ? (
          <p
            id="password-error"
            className="text-xs text-[var(--color-danger-500)]"
            role="alert"
          >
            Incorrect password. Check the password and try again.
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="remember"
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        <label htmlFor="remember" className="text-sm">
          Remember me
        </label>
      </div>

      {rateLimited ? (
        <p className="text-xs text-[var(--color-danger-500)]" role="alert">
          Too many attempts. Try again in {retryAfter ?? 60} seconds.
        </p>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white"
        disabled={submitting || loginPending || rateLimited}
      >
        {submitting || loginPending ? "Signing in…" : "Sign in"}
      </button>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-xs">or</span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <button
        type="button"
        className="rounded-md border px-4 py-2 text-sm font-medium"
        onClick={onGithub}
        disabled={oauthPending !== null}
      >
        {oauthPending ? "Redirecting…" : "Continue with GitHub"}
      </button>
    </form>
  );
}
