"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { useConfirmPasswordReset } from "@/hooks/use-auth";

export function ConfirmForm({ token }: { token: string }) {
  const confirmMutation = useConfirmPasswordReset();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const mismatch = confirmTouched && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmit =
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    token.length > 0;

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
          Your password has been updated. You can sign in with your new
          password.
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
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
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
            Use at least 8 characters with a mix of letters, numbers and
            symbols.
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
