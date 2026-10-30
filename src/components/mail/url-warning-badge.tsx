"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlWarningBadgeProps {
  suspiciousCount: number;
  className?: string;
}

export function UrlWarningBadge({ suspiciousCount, className }: UrlWarningBadgeProps) {
  if (suspiciousCount === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400",
        className
      )}
      role="alert"
      aria-label={`${suspiciousCount} suspicious link${suspiciousCount > 1 ? "s" : ""} detected`}
      data-testid="url-warning-badge"
    >
      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      {suspiciousCount} suspicious link{suspiciousCount > 1 ? "s" : ""}
    </span>
  );
}
