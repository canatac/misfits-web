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
import { initiateGoogleLogin, initiateGithubLogin } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Validation helpers
 * ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Accept full email OR local-part username (admin). */
const USER_RE = /^[^\s@]+(?:@[^\s@]+\.[^\s@]+)?$/;

function isValidLoginId(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.includes("@")) return EMAIL_RE.test(v);
  // local-part only (bootstrap admin, mailbox user_id)
  return /^[A-Za-z0-9._+-]{1,64}$/.test(v);
}

function isRateLimited(retryAfter?: number): boolean {
  return Boolean(retryAfter && retryAfter > Date.now());
}

function formatRetry(retryAfter?: number): string {
  if (!retryAfter) return "a few minutes";
  const secs = Math.max(0, Math.ceil((retryAfter - Date.now()) / 1000));
  if (secs < 60) return `${secs}s`;
  return `${Math.ceil(secs / 60)}m`;
}

/* ------------------------------------------------------------------ *
 * OAuth error messages
 * ------------------------------------------------------------------ */

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Social login failed. Please try again.",
  oauth_cancelled: "Login was cancelled. You can try again or use your email and password.",
};

function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}

/* ------------------------------------------------------------------ *
 * Login page
 * ------------------------------------------------------------------ */

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
    (s) => s.pendingTwoFactorChallengeId,
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
  const [oauthPending, setOauthPending] = useState<"google" | "github" | null>(null);

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
      router.replace(newSearch ? `/login?${newSearch}` : "/login", { scroll: false });
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

  function handleOAuthClick(provider: "google" | "github") {
    setOauthPending(provider);
    if (provider === "google") {
      initiateGoogleLogin();
    } else {
      initiateGithubLogin();
    }
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
                tone={oauthErrorCode === "oauth_cancelled" ? "warning" : "danger"}
              />
            ) : null}

            {showFormError ? (
              <ErrorBanner
                role="alert"
                aria-live="assertive"
                message={
                  rateLimited
                    ? `Too many attempts. Try again in ${formatRetry(authError?.retryAfter)}.`
                    : authError?.message ?? "Login failed."
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
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]"
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
                    loading={oauthPending === "google"}
                    onClick={() => handleOAuthClick("google")}
                  >
                    {oauthPending !== "google" && <GoogleIcon />}
                    Continuer avec Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={submitting || oauthPending !== null}
                    loading={oauthPending === "github"}
                    onClick={() => handleOAuthClick("github")}
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

                <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
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
                      authError?.code === "invalid_credentials" ? "true" : "false"
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

/* ------------------------------------------------------------------ *
 * Local error banner
 * ------------------------------------------------------------------ */

function ErrorBanner({
  message,
  tone,
  ...rest
}: {
  message: string;
  tone: "danger" | "warning";
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-sm",
        tone === "danger"
          ? "border-[var(--color-danger-500)] bg-[var(--color-danger-50)] text-[var(--color-danger-700)] dark:bg-[var(--color-danger-900)] dark:text-[var(--color-danger-300)]"
          : "border-[var(--color-warning-500)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)] dark:bg-[var(--color-warning-900)] dark:text-[var(--color-warning-300)]",
      )}
      {...rest}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * OAuth provider icons (inline SVG)
 * ------------------------------------------------------------------ */

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .319.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12Z" />
    </svg>
  );
}
