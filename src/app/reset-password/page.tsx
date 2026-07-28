/**
 * Password reset page for misfits.ai Mail.
 *
 * Two phases on a single route:
 *  - Request phase (default, no `token` query param): user enters their email
 *    and we send a reset link.
 *  - Confirm phase (`?token=...`): user sets a new password (with strength
 *    indicator + confirmation field) and submits it along with the token.
 */

"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { useRequestPasswordReset, useConfirmPasswordReset } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isConfirmPhase = Boolean(token);

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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">
            Reset password
          </h1>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="space-y-1">
            <CardTitle>
              {isConfirmPhase ? "Choose a new password" : "Forgot your password?"}
            </CardTitle>
            <CardDescription>
              {isConfirmPhase
                ? "Enter and confirm your new password below."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConfirmPhase ? (
              <ConfirmForm token={token!} />
            ) : (
              <RequestForm />
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-fg)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Request phase
 * ------------------------------------------------------------------ */

function RequestForm() {
  const requestMutation = useRequestPasswordReset();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const emailError = emailTouched && !emailValid && email.length > 0;
  const done = requestMutation.isSuccess;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailValid) {
      setEmailTouched(true);
      return;
    }
    requestMutation.mutate({ email });
  }

  if (done) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-4 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2
          className="h-12 w-12 text-[var(--color-success-500)]"
          aria-hidden="true"
        />
        <p className="text-sm text-[var(--color-fg)]">
          If an account exists for <strong>{email}</strong>, a reset link is on
          its way. Check your inbox (and spam folder).
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "reset-email-error" : undefined}
          required
        />
        {emailError ? (
          <p
            id="reset-email-error"
            className="text-xs text-[var(--color-danger-500)]"
            role="alert"
          >
            Please enter a valid email address.
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        loading={requestMutation.isPending}
        disabled={requestMutation.isPending}
      >
        Send reset link
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Confirm phase
 * ------------------------------------------------------------------ */

function ConfirmForm({ token }: { token: string }) {
  const confirmMutation = useConfirmPasswordReset();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const mismatch = confirmTouched && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmit =
    newPassword.length >= 8 && newPassword === confirmPassword && token.length > 0;

  const done = confirmMutation.isSuccess;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) {
      setConfirmTouched(true);
      return;
    }
    confirmMutation.mutate({ token, newPassword });
  }

  if (done) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-4 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2
          className="h-12 w-12 text-[var(--color-success-500)]"
          aria-hidden="true"
        />
        <p className="text-sm text-[var(--color-fg)]">
          Your password has been updated. You can sign in with your new password.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {confirmMutation.isError ? (
        <div
          className="mb-2 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] p-3 text-sm text-[var(--color-danger-700)] dark:bg-[var(--color-danger-900)] dark:text-[var(--color-danger-300)]"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {confirmMutation.error instanceof Error
              ? confirmMutation.error.message
              : "Could not reset password. The link may have expired."}
          </span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          aria-describedby="new-password-help"
          aria-invalid={tooShort ? "true" : "false"}
          required
          minLength={8}
        />
        <PasswordStrengthIndicator password={newPassword} />
        {tooShort ? (
          <p
            id="new-password-help"
            className="text-xs text-[var(--color-danger-500)]"
            role="alert"
          >
            Password must be at least 8 characters.
          </p>
        ) : (
          <p
            id="new-password-help"
            className="text-xs text-[var(--color-muted-fg)]"
          >
            Use at least 8 characters with a mix of letters, numbers and symbols.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
          aria-invalid={mismatch ? "true" : "false"}
          aria-describedby={mismatch ? "confirm-mismatch" : undefined}
          required
        />
        {mismatch ? (
          <p
            id="confirm-mismatch"
            className="text-xs text-[var(--color-danger-500)]"
            role="alert"
          >
            Passwords do not match.
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        loading={confirmMutation.isPending}
        disabled={confirmMutation.isPending || !canSubmit}
      >
        Reset password
      </Button>
    </form>
  );
}
