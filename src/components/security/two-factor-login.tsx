"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  challengeId: string;
  onCancel: () => void;
};

export function TwoFactorLogin({ challengeId, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    const res = await fetch("/api/auth/2fa/verify-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code }),
    });
    if (!res.ok) {
      setError("Invalid code. Try again.");
      return;
    }
    window.location.assign("/mail");
  }

  return (
    <div className="space-y-4" role="region" aria-label="Two-factor verification">
      <Label htmlFor="login-totp-code">Enter 6-digit code</Label>
      <Input
        id="login-totp-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
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
      <Button variant="ghost" onClick={onCancel} className="w-full">
        Cancel
      </Button>
    </div>
  );
}
