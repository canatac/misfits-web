/**
 * Login page for misfits.ai Mail.
 */

"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLogin, use2FA } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { initiateGithubLogin } from "@/lib/api-auth";

import { isValidLoginId, isRateLimited, formatRetry, getOAuthErrorMessage } from "./helpers";
import { ErrorBanner } from "./parts";
import { CredentialsForm } from "./parts/credentials-form";
import { TwoFactorForm } from "./parts/two-factor-form";

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

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [code, setCode] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  const [oauthPending, setOauthPending] = useState<"github" | null>(null);

  const oauthErrorCode = searchParams.get("error");
  const oauthErrorMessage = getOAuthErrorMessage(oauthErrorCode);

  const emailValid = isValidLoginId(email);
  const emailError = emailTouched && !emailValid && email.length > 0;

  const is2FAStep = pendingTwoFactorChallengeId !== null;

  useEffect(() => {
    if (is2FAStep) codeInputRef.current?.focus();
  }, [is2FAStep]);

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

  const rateLimited = isRateLimited(authError?.retryAfter);
  const showFormError = authError && !is2FAStep;

  function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailValid) {
      setEmailTouched(true);
      return;
    }
    clearError();
    loginMutation.mutate({ email, password, remember });
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--color-brand-200) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
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
              <TwoFactorForm
                code={code}
                setCode={setCode}
                codeInputRef={codeInputRef}
                onSubmit={handle2FASubmit}
                onBack={backToCredentials}
                pending={twoFactorMutation.isPending}
                isError={twoFactorMutation.isError}
              />
            ) : (
              <CredentialsForm
                email={email}
                setEmail={setEmail}
                emailError={emailError}
                setEmailTouched={setEmailTouched}
                password={password}
                setPassword={setPassword}
                remember={remember}
                setRemember={setRemember}
                onSubmit={handleLoginSubmit}
                submitting={submitting}
                loginPending={loginMutation.isPending}
                rateLimited={rateLimited}
                retryAfter={authError?.retryAfter}
                invalidCredentials={authError?.code === "invalid_credentials"}
                oauthPending={oauthPending}
                onGithub={handleGithubOAuthClick}
              />
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
