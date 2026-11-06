"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { GithubIcon } from "../parts";

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
  retryAfter?: number;
  invalidCredentials: boolean;
  oauthPending: "github" | null;
  onGithub: () => void;
};

export function CredentialsForm({
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
}: CredentialsFormProps) {
  const githubPending = oauthPending === "github";

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onGithub}
        disabled={githubPending || submitting}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] transition-colors",
          "hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {githubPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <GithubIcon />
        )}
        <span>{githubPending ? "Connecting to GitHub…" : "Continue with GitHub"}</span>
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--color-bg)] px-2 text-[var(--color-muted-fg)]">Or</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            Email or login
          </label>
          <input
            id="login-email"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={setEmailTouched}
            aria-invalid={emailError ? "true" : "false"}
            aria-describedby={emailError ? "email-error" : undefined}
            className={cn(
              "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-fg)] outline-none transition-colors",
              "focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-200)]",
              emailError && "border-[var(--color-danger-500)]"
            )}
          />
          {emailError ? (
            <p id="email-error" role="alert" className="text-xs text-[var(--color-danger-600)]">
              Enter a valid email address or login.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={invalidCredentials ? "true" : "false"}
            aria-describedby={
              invalidCredentials ? "password-error" : "password-help"
            }
            className={cn(
              "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-fg)] outline-none transition-colors",
              "focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-200)]",
              invalidCredentials && "border-[var(--color-danger-500)]"
            )}
          />
          {invalidCredentials ? (
            <p id="password-error" role="alert" className="text-xs text-[var(--color-danger-600)]">
              Incorrect password. Check your credentials and try again.
            </p>
          ) : (
            <p id="password-help" aria-live="polite" className="text-xs text-[var(--color-muted-fg)]">
              {password.length} characters entered.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            Remember me
          </label>
          <a
            href="/reset-password"
            className="text-sm text-[var(--color-brand-500)] hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-4 py-2.5 text-sm font-medium text-white transition-colors",
            "hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {loginPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          <span>{loginPending ? "Signing in…" : "Sign in"}</span>
        </button>

        {rateLimited ? (
          <p className="text-center text-xs text-[var(--color-warning-600)]">
            Too many attempts. Try again in {retryAfter ? "a moment" : "a few minutes"}.
          </p>
        ) : null}
      </form>
    </div>
  );
}
