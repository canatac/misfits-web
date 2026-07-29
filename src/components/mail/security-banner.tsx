"use client";
import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, X, Ban, Flag } from "lucide-react";
import type { PhishingResult } from "@/types/security";
import { cn } from "@/lib/utils";

const THREAT_CONFIG = {
  safe: { color: "green", icon: ShieldCheck, label: "Safe", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", text: "text-green-700 dark:text-green-400" },
  suspicious: { color: "yellow", icon: Shield, label: "Suspicious", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-700 dark:text-yellow-400" },
  dangerous: { color: "orange", icon: ShieldAlert, label: "Dangerous", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-400" },
  critical: { color: "red", icon: ShieldAlert, label: "Critical", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-400" },
};

export function SecurityBanner({ result, emailId }: { result: PhishingResult; emailId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const config = THREAT_CONFIG[result.threatLevel];
  const Icon = config.icon;
  const dismissKey = `sec-dismiss-${emailId}`;

  if (dismissed || (typeof localStorage !== "undefined" && localStorage.getItem(dismissKey))) return null;

  return (
    <div className={cn("mb-4 rounded-[var(--radius-lg)] border p-4", config.bg, config.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.text)} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", config.text)}>{config.label}</span>
            <span className="text-xs text-[var(--color-muted-fg)]">Threat score: {result.score}/100</span>
            <button onClick={() => setExpanded(!expanded)} className="ml-auto" aria-label="Toggle details">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          {result.reasons.length > 0 && (
            <p className="mt-1 text-sm text-[var(--color-muted-fg)]">{result.reasons[0]}</p>
          )}
          {expanded && (
            <ul className="mt-2 space-y-1">
              {result.indicators.map((ind, i) => (
                <li key={i} className="text-xs text-[var(--color-muted-fg)]">
                  <span className="font-medium">{ind.description}</span>
                  {ind.detail && ` — ${ind.detail}`}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex gap-2">
            <button className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
              <Ban className="mr-1 inline h-3 w-3" />Block sender
            </button>
            <button className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
              <Flag className="mr-1 inline h-3 w-3" />Report phishing
            </button>
          </div>
        </div>
        <button onClick={() => { setDismissed(true); if (typeof localStorage !== "undefined") localStorage.setItem(dismissKey, "1"); }} aria-label="Dismiss">
          <X className="h-4 w-4 text-[var(--color-muted-fg)]" />
        </button>
      </div>
    </div>
  );
}
