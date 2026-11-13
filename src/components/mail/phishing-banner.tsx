"use client";

import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhishingScanResult, ThreatLevel } from "@/lib/phishing-scanner";

interface PhishingBannerProps {
  result: PhishingScanResult;
  className?: string;
}

const THREAT_STYLES: Record<ThreatLevel, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  safe: { bg: "bg-green-500/10", border: "border-green-500/50", text: "text-green-300", icon: Info },
  low: { bg: "bg-blue-500/10", border: "border-blue-500/50", text: "text-blue-300", icon: Info },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/50", text: "text-amber-300", icon: AlertTriangle },
  high: { bg: "bg-red-500/10", border: "border-red-500/50", text: "text-red-300", icon: ShieldAlert },
};

export function PhishingBanner({ result, className }: PhishingBannerProps) {
  if (result.threatLevel === "safe") return null;
  const style = THREAT_STYLES[result.threatLevel];
  const Icon = style.icon;
  return (
    <div
      className={cn(
        "mb-3 rounded-[var(--radius-md)] border px-3 py-2",
        style.bg, style.border, style.text,
        className
      )}
      role="alert"
      data-testid="phishing-banner"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">
          {result.threatLevel === "high"
            ? "This email may be a phishing attempt"
            : result.threatLevel === "medium"
              ? "This email has suspicious characteristics"
              : "This email has minor warnings"}
        </span>
      </div>
      {result.indicators.length > 0 && (
        <ul className="mt-2 space-y-1">
          {result.indicators.map((ind, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{ind.detail} ({ind.severity})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
