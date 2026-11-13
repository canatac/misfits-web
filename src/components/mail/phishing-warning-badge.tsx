"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThreatLevel } from "@/lib/phishing-scanner";

interface PhishingWarningBadgeProps {
  threatLevel: ThreatLevel;
  className?: string;
}

export function PhishingWarningBadge({ threatLevel, className }: PhishingWarningBadgeProps) {
  if (threatLevel === "safe" || threatLevel === "low") return null;
  const color = threatLevel === "high" ? "text-red-400 bg-red-500/20" : "text-amber-400 bg-amber-500/20";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        color, className
      )}
      role="alert"
      aria-label={`Phishing warning: ${threatLevel} threat level`}
      data-testid="phishing-warning-badge"
    >
      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      {threatLevel === "high" ? "Suspect" : "Suspicious"}
    </span>
  );
}
