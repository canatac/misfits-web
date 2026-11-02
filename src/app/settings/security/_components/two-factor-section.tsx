"use client";

import * as React from "react";
import { ShieldCheck, KeyRound, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTwoFactor } from "@/hooks/use-two-factor";

function normalizeCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function TwoFactorSection() {
  const { status, setup, activate, deactivate, busy, error } = useTwoFactor();
  const [code, setCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const qr = setup?.qrCode ?? status?.qrCode ?? null;
  const secret = setup?.secret ?? status?.secret ?? null;
  const recoveryCodes = setup?.recoveryCodes ?? status?.recoveryCodes ?? [];

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-muted)]">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <ShieldCheck className="h-5 w-5 text-[var(--color-brand-500)]" aria-hidden="true" />
        <CardTitle className="text-base">Two-factor authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-muted-fg)]">
          {status?.enabled
            ? "Two-factor authentication is enabled. Each sign-in requires a 6-digit code from your authenticator app."
            : "Add a second layer of security with a TOTP authenticator app."}
        </p>

        {error ? (
          <p role="alert" className="text-sm text-[var(--color-danger-500)]">
            {error}
          </p>
        ) : null}

        {status?.enabled ? (
          <div className="space-y-3">
            {recoveryCodes.length > 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Recovery codes
                </p>
                <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-[var(--color-muted-fg)]">
                  {recoveryCodes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-[var(--color-muted-fg)]">
                  Store these codes somewhere safe. Each code can be used once.
                </p>
              </div>
            ) : null}
            <Button variant="outline" loading={busy} onClick={() => deactivate()}>
              Disable two-factor authentication
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt="QR code to add this account to your authenticator app"
                  width={160}
                  height={160}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-2"
                />
              ) : (
                <Button variant="outline" loading={busy} onClick={() => setup2fa()}>
                  Set up authenticator
                </Button>
              )}
            </div>

            {secret ? (
              <div className="flex items-center gap-2">
                <Label htmlFor="two-factor-secret" className="sr-only">
                  Manual setup key
                </Label>
                <Input
                  id="two-factor-secret"
                  readOnly
                  value={secret}
                  className="font-mono text-xs"
                />
                <Button type="button" variant="ghost" size="icon" onClick={copySecret} aria-label="Copy setup key">
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
            ) : null}

            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.length !== 6) return;
                activate(code);
              }}
            >
              <Label htmlFor="two-factor-code">Verification code</Label>
              <Input
                id="two-factor-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
                className="text-center text-lg tracking-[0.5em]"
                required
              />
              <Button type="submit" loading={busy} disabled={code.length !== 6}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Enable two-factor authentication
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
