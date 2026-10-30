"use client";

import { useState } from "react";
import { useAuthStore, selectTwoFactorEnabled } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TwoFactorSetup } from "@/components/security/two-factor-setup";
import { TwoFactorStatus } from "@/components/security/two-factor-status";

export default function SecuritySettingsPage() {
  const [showSetup, setShowSetup] = useState(false);
  const twoFactorEnabled = useAuthStore(selectTwoFactorEnabled);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {twoFactorEnabled ? (
            <TwoFactorStatus />
          ) : showSetup ? (
            <TwoFactorSetup onComplete={() => setShowSetup(false)} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-muted-fg)]">
                Two-factor authentication is not enabled.
              </p>
              <Button onClick={() => setShowSetup(true)}>
                Enable 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
