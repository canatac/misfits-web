/**
 * Registration page for misfits.ai Mail.
 *
 * Uses the existing auth mutation hook and shared UI primitives to keep
 * visual and behavioral parity with the login/reset flows.
 */

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, AlertTriangle } from "lucide-react";

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
import { useRegister } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const registerMutation = useRegister();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const emailError = emailTouched && !emailValid && email.length > 0;

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMismatch =
    confirmTouched && password.length > 0 && password !== confirmPassword;
  const termsError = termsTouched && !acceptTerms;

  const canSubmit =
    emailValid &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptTerms &&
    !registerMutation.isPending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) {
      setEmailTouched(true);
      setConfirmTouched(true);
      setTermsTouched(true);
      return;
    }

    registerMutation.mutate({
      email: email.trim(),
      password,
      displayName: displayName.trim() || undefined,
      acceptTerms: true,
    });
  }

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
              Create your account
            </p>
          </div>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="space-y-1">
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Register to access your privacy-first inbox.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {registerMutation.isError ? (
              <ErrorBanner
                message={
                  registerMutation.error instanceof Error
                    ? registerMutation.error.message
                    : "Registration failed. Please try again."
                }
              />
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name (optional)</Label>
                <Input
                  id="display-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailError ? "true" : "false"}
                  aria-describedby={emailError ? "register-email-error" : undefined}
                  required
                />
                {emailError ? (
                  <p
                    id="register-email-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    Please enter a valid email address.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={passwordTooShort ? "true" : "false"}
                  aria-describedby="register-password-help"
                  required
                  minLength={8}
                />
                <PasswordStrengthIndicator password={password} />
                {passwordTooShort ? (
                  <p
                    id="register-password-help"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    Password must be at least 8 characters.
                  </p>
                ) : (
                  <p
                    id="register-password-help"
                    className="text-xs text-[var(--color-muted-fg)]"
                  >
                    Use at least 8 characters with a mix of letters, numbers and symbols.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">Confirm password</Label>
                <Input
                  id="register-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  aria-invalid={passwordMismatch ? "true" : "false"}
                  aria-describedby={passwordMismatch ? "register-confirm-error" : undefined}
                  required
                />
                {passwordMismatch ? (
                  <p
                    id="register-confirm-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    Passwords do not match.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptTerms}
                    onCheckedChange={(v) => {
                      setAcceptTerms(v === true);
                      setTermsTouched(true);
                    }}
                    aria-invalid={termsError ? "true" : "false"}
                    aria-describedby={termsError ? "accept-terms-error" : undefined}
                  />
                  <Label htmlFor="accept-terms" className="text-sm font-normal leading-5">
                    I agree to the Terms of Service and Privacy Policy.
                  </Label>
                </div>
                {termsError ? (
                  <p
                    id="accept-terms-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    You must accept the terms to create an account.
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={registerMutation.isPending}
                disabled={!canSubmit}
              >
                Create account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--color-muted-fg)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--color-brand-500)] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function ErrorBanner({
  message,
  className,
  ...rest
}: {
  message: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] p-3 text-sm text-[var(--color-danger-700)] dark:bg-[var(--color-danger-900)] dark:text-[var(--color-danger-300)]",
        className,
      )}
      role="alert"
      aria-live="assertive"
      {...rest}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}