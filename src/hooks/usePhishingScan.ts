"use client";

import { useMemo } from "react";
import { scanForPhishing, type PhishingScanResult } from "@/lib/phishing-scanner";
import type { Email } from "@/types/email";
import { useSecuritySettingsStore } from "@/stores/security-settings-store";

export function usePhishingScan(email: Email | null): PhishingScanResult {
  const sensitivity = useSecuritySettingsStore((s) => s.phishingSensitivity);
  return useMemo(() => {
    if (!email) return { threatLevel: "safe", score: 0, indicators: [], scannedAt: new Date().toISOString() };
    return scanForPhishing({
      from: { name: email.from.name, address: email.from.address },
      body: email.body,
      bodyType: email.bodyType,
      attachments: email.attachments?.map((a) => ({ filename: a.filename ?? "unknown" })),
      headers: email.headers,
      sensitivity,
    });
  }, [email, sensitivity]);
}
