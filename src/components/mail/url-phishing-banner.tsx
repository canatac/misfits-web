"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, ExternalLink, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  scanUrls,
  type UrlReputation,
} from "@/lib/url-scanner";

interface UrlPhishingBanner {
  body: string;
  bodyType: "html" | "text";
  className?: string;
}

export function UrlPhishingBanner({ body, bodyType, className }: UrlPhishingBanner) {
  const [dismissed, setDismissed] = useState(false);

  const results = useMemo(
    () => scanUrls(body, bodyType).filter((r) => r.isSuspicious),
    [body, bodyType]
  );

  if (results.length === 0 || dismissed) return null;

  return (
    <div
      className={cn(
        "mb-3 rounded-[var(--radius-md)] border border-amber-500/50 bg-amber-500/10 px-3 py-2",
        className
      )}
      role="alert"
      data-testid="url-phishing-banner"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden="true" />
        <span className="text-sm font-medium text-amber-300">
          Suspicious link{results.length > 1 ? "s" : ""} detected in this email
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {results.map((r) => (
          <li key={r.url} className="flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {r.domain || r.url} — {r.reasons.join(", ")}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-amber-400 hover:underline"
          aria-label="Dismiss warning"
        >
          Dismiss
        </button>
        <span className="text-xs text-amber-500/70">
          Click links with caution
        </span>
      </div>
    </div>
  );
}
