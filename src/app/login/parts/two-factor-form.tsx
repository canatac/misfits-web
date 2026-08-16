"use client";

import type { FormEvent, RefObject } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TwoFactorFormProps = {
  code: string;
  setCode: (v: string) => void;
  codeInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  pending: boolean;
  isError: boolean;
};

export function TwoFactorForm({
  code,
  setCode,
  codeInputRef,
  onSubmit,
  onBack,
  pending,
  isError,
}: TwoFactorFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
            aria-invalid={isError ? "true" : "false"}
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
        loading={pending}
        disabled={code.length !== 6}
      >
        Verify
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-1.5 text-sm text-[var(--color-muted-fg)] transition hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to sign in
      </button>
    </form>
  );
}
