"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ShieldCheck, KeyRound } from "lucide-react";

type Props = {
  onComplete: () => void;
};

export function TwoFactorSetup({ onComplete }: Props) {
  const [step, setStep] = useState<"qr" | "verify" | "recovery">("qr");
  const [secret, setSecret] = useState("");
  const [otpAuthUrl, setOtpAuthUrl] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleVerify() {
    setError(null);
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    // Verify TOTP code via backend
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      setError("Invalid code. Try again.");
      return;
    }
    const data = await res.json();
    setRecoveryCodes(data.recoveryCodes);
    setStep("recovery");
  }

  function copyRecoveryCodes() {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
  }

  return (
    <div className="space-y-6" role="region" aria-label="2FA setup">
      {step === "qr" && (
        <div className="space-y-4">
          <p className="text-sm">Scan this QR code with your authenticator app:</p>
          <div className="flex justify-center">
            {otpAuthUrl ? (
              <QRCodeSVG value={otpAuthUrl} size={200} />
            ) : (
              <div className="h-[200px] w-[200px] animate-pulse bg-[var(--color-border)]" />
            )}
          </div>
          {secret && (
            <p className="break-all text-center text-xs text-[var(--color-muted-fg)]">
              Manual entry: {secret}
            </p>
          )}
          <Button onClick={() => setStep("verify")} className="w-full">
            Next
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <Label htmlFor="totp-code">Enter 6-digit code</Label>
          <Input
            id="totp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\\D/g, ""))}
            aria-label="TOTP verification code"
          />
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleVerify} className="w-full">
            Verify
          </Button>
        </div>
      )}

      {step === "recovery" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" aria-hidden="true" />
            <p className="font-medium">2FA enabled!</p>
          </div>
          <p className="text-sm">Save these recovery codes in a safe place:</p>
          <div className="rounded border bg-[var(--color-bg-muted)] p-3 font-mono text-xs">
            {recoveryCodes.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
          <Button variant="outline" onClick={copyRecoveryCodes} className="w-full">
            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
            {copied ? "Copied!" : "Copy codes"}
          </Button>
          <Button onClick={onComplete} className="w-full">
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
