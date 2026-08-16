/**
 * Login page for misfits.ai Mail.
 *
 * Two-step flow:
 *  1. Email + password (with strength indicator + "remember me").
 *  2. 6-digit 2FA code (only shown when the backend responds with
 *     `two_factor_required`).
 *
 * All UI primitives come from the existing design system in src/components/ui.
 */

"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { useLogin, use2FA } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { initiateGithubLogin } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { isValidLoginId, isRateLimited, formatRetry, getOAuthErrorMessage } from "./helpers";
import { ErrorBanner, GithubIcon } from "./parts";
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
function LoginInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const pendingTwoFactorChallengeId = useAuthStore(
    (s) => s.pendingTwoFactorChallengeId
  );
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const loginMutation = useLogin();
  const twoFactorMutation = use2FA();

  // Step 1 state
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  // Step 2 state
  const [code, setCode] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  // OAuth per-provider loading state
  const [oauthPending, setOauthPending] = useState<"github" | null>(null);

  // OAuth error from ?error= query param (set by callback route on failure)
  const oauthErrorCode = searchParams.get("error");
  const oauthErrorMessage = getOAuthErrorMessage(oauthErrorCode);

  const emailValid = isValidLoginId(email);
  const emailError = emailTouched && !emailValid && email.length > 0;

  const is2FAStep = pendingTwoFactorChallengeId !== null;

  // Focus the 2FA input when entering that step.
  useEffect(() => {
    if (is2FAStep) codeInputRef.current?.focus();
  }, [is2FAStep]);

  // Clear the ?error= query param from the URL after displaying it once
  // so a manual page refresh doesn't re-show it.
  useEffect(() => {
    if (oauthErrorCode) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      const newSearch = params.toString();
      router.replace(newSearch ? `/login?${newSearch}` : "/login", {
        scroll: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Success navigation handled solely by useLogin (replace) — avoid double /mail push.

  const rateLimited = isRateLimited(authError?.retryAfter);
  const showFormError = authError && !is2FAStep;

  /* --- handlers --- */

  function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailValid) {
      setEmailTouched(true);
      return;
    }
    clearError();
    loginMutation.mutate({
      email,
      password,
      remember,
    });
  }

  function handle2FASubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length !== 6) return;
    if (!pendingTwoFactorChallengeId) return;
    twoFactorMutation.mutate({
      challengeId: pendingTwoFactorChallengeId,
      code,
    });
  }

  function backToCredentials() {
    clearError();
    useAuthStore.setState({ pendingTwoFactorChallengeId: null });
    setCode("");
  }

  function handleGithubOAuthClick() {
    setOauthPending("github");
    const redirect = searchParams.get("redirect");
    const safeRedirect =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : undefined;
    initiateGithubLogin(safeRedirect);
  }

  const submitting = loginMutation.isPending || twoFactorMutation.isPending;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-12">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--color-brand-200) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] shadow-[var(--shadow-lg)]">
            <Mail className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">
              misfits.ai Mail
            </h1>
            <p className="text-sm text-[var(--color-muted-fg)]">
              Sign in to your inbox
            </p>
          </div>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="space-y-1">
            <CardTitle>
              {is2FAStep ? "Two-factor authentication" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {is2FAStep
                ? "Enter the 6-digit code from your authenticator app."
                : "Enter your credentials to continue."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* OAuth error banner — shown when the callback route redirects here with ?error= */}
            {oauthErrorMessage ? (
              <ErrorBanner
                role="alert"
                aria-live="assertive"
                message={oauthErrorMessage}
                tone={
                  oauthErrorCode === "oauth_cancelled" ? "warning" : "danger"
                }
              />
            ) : null}

            {showFormError ? (
              <ErrorBanner
                role="alert"
                aria-live="assertive"
                message={
                  rateLimited
                    ? `Too many attempts. Try again in ${formatRetry(authError?.retryAfter)}.`
                    : (authError?.message ?? "Login failed.")
                }
                tone={rateLimited ? "warning" : "danger"}
              />
            ) : null}

            {is2FAStep ? (
              <form onSubmit={handle2FASubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Verification code</Label>
                  <div className="relative">
                    <ShieldCheck
                      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]"
                      aria-hidden="true"
                    />
                    <Input
                      id="mfa-code"
                      ref={codeInputRef}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      aria-invalid={
                        twoFactorMutation.isError ? "true" : "false"
                      }
                      aria-describedby="mfa-code-help"
                      className="pl-9 text-center text-lg tracking-[0.5em]"
                      required
                    />
                  </div>
                  <p
                    id="mfa-code-help"
                    className="text-xs text-[var(--color-muted-fg)]"
                  >
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={twoFactorMutation.isPending}
                  disabled={code.length !== 6}
                >
                  Verify
                </Button>

                <button
                  type="button"
                  onClick={backToCredentials}
                  className="flex w-full items-center justify-center gap-1.5 text-sm text-[var(--color-muted-fg)] transition hover:text-[var(--color-fg)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Back to sign in
                </button>
              </form>
            ) : (
              <>
                {/* OAuth providers */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={submitting || oauthPending !== null}
                    loading={oauthPending === "github"}
                    onClick={handleGithubOAuthClick}
                  >
                    {oauthPending !== "github" && <GithubIcon />}
                    Continuer avec GitHub
                  </Button>
                </div>

                {/* Divider */}
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

                <form
                  onSubmit={handleLoginSubmit}
                  className="space-y-4"
                  noValidate
                >
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
                      aria-invalid={
                        authError?.code === "invalid_credentials"
                          ? "true"
                          : "false"
                      }
                      aria-describedby="password-help"
                      required
                    />
                    <PasswordStrengthIndicator password={password} />
                    <p
                      id="password-help"
                      className="sr-only"
                      aria-live="polite"
                    >
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
                    loading={loginMutation.isPending}
                    disabled={loginMutation.isPending || rateLimited}
                  >
                    {rateLimited
                      ? `Try again in ${formatRetry(authError?.retryAfter)}`
                      : "Sign in"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--color-muted-fg)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--color-brand-500)] underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-[var(--color-muted-fg)]">
          © 2026 misfits.ai — Privacy-first email
        </p>
      </div>
    </main>
  );
}

