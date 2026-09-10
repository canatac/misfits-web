"use client";
import { ArrowLeft, Mail } from "lucide-react";
import type { OnboardingEmail } from "@/hooks/use-onboarding-email";

interface OnboardingEmailViewProps {
  email: OnboardingEmail;
  onBack: () => void;
  onDismiss: () => void;
}

export function OnboardingEmailView({ email, onBack, onDismiss }: OnboardingEmailViewProps) {
  return (
    <div className="flex h-full flex-col bg-[#0A0A0B]" data-testid="onboarding-email-view">
      <div className="flex items-center gap-3 border-b border-[#242427] px-4 py-3">
        <button type="button" aria-label="Back to inbox" onClick={onBack}
          className="rounded-md p-1.5 text-[#71717A] hover:bg-[#242427]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 truncate text-base font-semibold text-[#E4E4E7]">{email.subject}</h2>
      </div>
      <div className="border-b border-[#242427] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00D400]/10">
            <Mail className="h-5 w-5 text-[#00D400]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#E4E4E7]">{email.from.name}</span>
              <span className="text-xs text-[#71717A]">&lt;{email.from.address}&gt;</span>
            </div>
            <p className="mt-0.5 text-xs text-[#71717A]">To: {email.to.map((t: { address: string }) => t.address).join(", ")}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl" dangerouslySetInnerHTML={{ __html: email.body }} />
      </div>
      <div className="border-t border-[#242427] px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#71717A]">Reply to chat with Hermes, your AI assistant</p>
          <button type="button" data-testid="onboarding-got-it" onClick={onDismiss}
            className="rounded-lg bg-[#00D400] px-4 py-2 text-sm font-semibold text-[#0A0A0B] hover:opacity-90">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
