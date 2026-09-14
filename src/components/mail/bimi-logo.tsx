"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/components/mail/email-view-utils";
import type { BimiRecord } from "@/lib/bimi";

interface BimiLogoProps {
  /** Sender name for fallback initials */
  senderName: string;
  /** BIMI record with logo URL (if available) */
  bimi?: BimiRecord;
  /** Size class (tailwind) */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

/**
 * BimiLogo — displays the BIMI brand logo for verified senders,
 * with graceful fallback to initials when BIMI is unavailable or invalid.
 */
export function BimiLogo({
  senderName,
  bimi,
  size = "md",
  className,
}: BimiLogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "h-9 w-9",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const fallbackClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const hasValidBimi = bimi?.isValid && bimi.logoUrl && !imgError;

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={cn(sizeClasses[size])}>
        {hasValidBimi ? (
          <AvatarImage
            src={bimi.logoUrl}
            alt={`${senderName} brand logo`}
            onError={() => setImgError(true)}
            className="object-contain bg-white p-0.5"
          />
        ) : null}
        <AvatarFallback className={cn(fallbackClasses[size])}>
          {getInitials(senderName)}
        </AvatarFallback>
      </Avatar>
      {hasValidBimi && (
        <div
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0A0A0B]"
          aria-label="Verified sender (BIMI)"
          data-testid="bimi-verified-badge"
        />
      )}
    </div>
  );
}
