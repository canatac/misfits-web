"use client";

import { AlertTriangle, Paperclip } from "lucide-react";
import type { Recipient } from "@/types/composer";

interface ComposerWarningsProps {
  hasExternal: boolean;
  attachmentMention: boolean;
  invalidRecipients: Recipient[];
}

export function ComposerWarnings({
  hasExternal,
  attachmentMention,
  invalidRecipients,
}: ComposerWarningsProps) {
  return (
    <>
      {hasExternal && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 px-3 py-2 text-sm text-[var(--color-warning-500)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            This email will be sent to external recipients outside misfits.ai.
          </span>
        </div>
      )}
      {attachmentMention && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 px-3 py-2 text-sm text-[var(--color-warning-500)]">
          <Paperclip className="h-4 w-4 shrink-0" />
          <span>You mentioned an attachment but none is attached.</span>
        </div>
      )}
      {invalidRecipients.length > 0 && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)]/30 bg-[var(--color-danger-500)]/10 px-3 py-2 text-sm text-[var(--color-danger-500)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Some recipient addresses are invalid.</span>
        </div>
      )}
    </>
  );
}
