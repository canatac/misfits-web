"use client";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingEmail } from "@/hooks/use-onboarding-email";

interface OnboardingEmailBannerProps {
  email: OnboardingEmail;
  onDismiss: () => void;
  onOpen: () => void;
}

export function OnboardingEmailBanner({ email, onDismiss, onOpen }: OnboardingEmailBannerProps) {
  return (
    <div data-testid="onboarding-email-banner"
      className={cn("flex items-center gap-3 border-b border-[#242427] bg-gradient-to-r from-[#0A0A0B] via-[#0F1410] to-[#0A0A0B] px-4 py-3")}
      onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      aria-label="Welcome email from misfits.ai">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00D400]/10">
        <Sparkles className="h-5 w-5 text-[#00D400]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-[#E4E4E7]">{email.from.name}</span>
          <span className="rounded-full bg-[#00D400]/10 px-2 py-0.5 text-[10px] font-medium text-[#00D400]">WELCOME</span>
        </div>
        <span className="truncate text-xs text-[#A1A1AA]">{email.subject}</span>
      </div>
      <button type="button" aria-label="Dismiss welcome email" data-testid="onboarding-dismiss"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="shrink-0 rounded-md p-1.5 text-[#71717A] hover:bg-[#242427]">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
