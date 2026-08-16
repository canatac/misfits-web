"use client";

import Link from "next/link";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";

import { formatRetry } from "../helpers";
import { GithubIcon } from "../parts";

type CredentialsFormProps = {
  email: string;
  setEmail: (v: string) => void;
  emailError: boolean;
  setEmailTouched: (v: boolean) => void;
  password: string;
  setPassword: (v: string) => void;
  remember: boolean;
  setRemember: (v: boolean) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  loginPending: boolean;
  rateLimited: boolean;
  retryAfter: number | undefined;
  invalidCredentials: boolean;
  oauthPending: "github" | null;
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

  return (
    <>
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={submitting || oauthPending !== null}
          loading={oauthPending === "github"}
          onClick={onGithub}
        >
          {oauthPending !== "github" && <GithubIcon />}
          Continuer avec GitHub
        </Button>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--color-bg)] px-2 text-[var(--color-muted-fg)]">
            ou
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email or username</Label>
          <Input
            id="email"
            type="text"
            autoComplete="username"
            placeholder="admin or you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={emailError ? "true" : "false"}
            aria-describedby={emailError ? "email-error" : undefined}
            required
          />
          {emailError ? (
            <p
              id="email-error"
              className="text-xs text-[var(--color-danger-500)]"
              role="alert"
            >
              Enter a username (e.g. admin) or a valid email.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/reset-password"
              className="text-xs text-[var(--color-brand-500)] underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={invalidCredentials ? "true" : "false"}
            aria-describedby="password-help"
            required
          />
          <PasswordStrengthIndicator password={password} />
          <p id="password-help" className="sr-only" aria-live="polite">
            {password.length === 0
              ? "Password is empty."
              : `${password.length} characters entered.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          <Label htmlFor="remember" className="text-sm font-normal">
            Remember me on this device
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loginPending}
          disabled={loginPending || rateLimited}
        >
          {rateLimited ? `Try again in ${formatRetry(retryAfter)}` : "Sign in"}
        </Button>
      </form>
    </>
  );
}
