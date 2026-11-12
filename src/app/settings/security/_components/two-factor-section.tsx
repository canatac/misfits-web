"use client";

import * as React from "react";
import { ShieldCheck, KeyRound, Copy, Check, Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTwoFactor } from "@/hooks/use-two-factor";

function normalizeCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function TwoFactorSection() {
  const { status, setup, setup2fa, activate, deactivate, busy, error } = useTwoFactor();
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
            : "Add a second layer of security with a TOTP authenticator app or a security key."}
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

            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Fingerprint className="h-4 w-4" aria-hidden="true" />
                Security key (FIDO2/WebAuthn)
              </p>
              <p className="mb-3 text-xs text-[var(--color-muted-fg)]">
                Register a hardware security key for phishing-resistant sign-in.
              </p>
              <SecurityKeyRegistration />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityKeyRegistration() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [keys, setKeys] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/webauthn/credentials")
      .then((r) => (r.ok ? r.json() : { credentials: [] }))
      .then((d) => {
        if (!cancelled) setKeys(d.credentials ?? []);
      })
      .catch(() => {
        if (!cancelled) setKeys([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const register = async () => {
    setBusy(true);
    setError(null);
    try {
      const optionsRes = await fetch("/api/auth/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!optionsRes.ok) throw new Error("Could not start security key registration");
      const options = await optionsRes.json();
      const assertion = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: base64UrlToBuffer(options.challenge),
          user: {
            ...options.user,
            id: base64UrlToBuffer(options.user.id),
          },
          excludeCredentials: (options.excludeCredentials ?? []).map((c: { id: string; type: string }) => ({
            ...c,
            id: base64UrlToBuffer(c.id),
          })),
        },
      });
      if (!assertion) throw new Error("No credential returned");
      const body = JSON.stringify({
        id: assertion.id,
        rawId: bufferToBase64Url(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: bufferToBase64Url(assertion.response.clientDataJSON),
          attestationObject: bufferToBase64Url(assertion.response.attestationObject),
        },
      });
      const finishRes = await fetch("/api/auth/webauthn/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!finishRes.ok) throw new Error("Security key registration failed");
      const d = await finishRes.json().catch(() => ({}));
      setKeys((prev) => [...prev, { id: assertion.id, name: d.name ?? "Security key" }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {keys.length > 0 ? (
        <ul className="space-y-1 text-xs text-[var(--color-muted-fg)]">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-1.5">
              <Fingerprint className="h-3 w-3" aria-hidden="true" />
              {k.name}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-[var(--color-danger-500)]">{error}</p>
      ) : null}
      <Button type="button" variant="outline" size="sm" loading={busy} onClick={register}>
        <Fingerprint className="h-4 w-4" aria-hidden="true" />
        Register security key
      </Button>
    </div>
  );
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < view.length; i += 1) {
    binary += String.fromCharCode(view[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
