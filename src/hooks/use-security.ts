"use client";
import { useSecurityStore } from "@/stores/security-store";
import { detectPhishing } from "@/lib/phishing-detector";
import type { Email } from "@/types/email";
import { useMemo } from "react";

export function useSecurityScan() {
  const scanEmail = useSecurityStore((s) => s.scanEmail);
  const scanBatch = useSecurityStore((s) => s.scanBatch);
  return { scanEmail, scanBatch };
}

export function useSecurityResult(emailId: string) {
  return useSecurityStore((s) => s.results[emailId]);
}

export function useSecurityStats() {
  const results = useSecurityStore((s) => s.results);
  return useMemo(() => {
    const stats: Record<string, number> = {
      safe: 0,
      suspicious: 0,
      dangerous: 0,
      critical: 0,
    };
    Object.values(results).forEach((r) => {
      stats[r.threatLevel]++;
    });
    return { stats, total: Object.keys(results).length };
  }, [results]);
}
