"use client";

/**
 * RecipientChip — chip UI for a single recipient in `RecipientInput`.
 * Extracted from `recipient-input.tsx` (cycle63).
 */
import { X, AlertTriangle } from "lucide-react";
import { validateRecipient } from "@/lib/email-validation";
import type { Recipient } from "@/types/composer";

export function recipientInitials(name: string, email: string): string {
  const base = name || email.split("@")[0] || "?";
  const parts = base.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function RecipientChip({
  recipient,
  onRemove,
}: {
  recipient: Recipient;
  onRemove: (id: string) => void;
}) {
  const external = validateRecipient(recipient.email).external;
  const displayName = recipient.name || recipient.email;

  return (
    <span
      className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] py-0.5 pr-1 pl-1.5 text-sm"
      data-testid="recipient-chip"
    >
      {recipient.color && recipient.name ? (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
          style={{ backgroundColor: recipient.color }}
        >
          {recipientInitials(recipient.name, recipient.email)}
        </span>
      ) : null}
      <span className="max-w-[200px] truncate">{displayName}</span>
      {external && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-warning-500)]/15 px-1 text-[10px] font-medium text-[var(--color-warning-500)]"
          title="External recipient"
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          ext
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(recipient.id)}
        className="rounded-full p-0.5 text-[var(--color-muted-fg)] transition-colors hover:bg-[var(--color-danger-500)]/10 hover:text-[var(--color-danger-500)]"
        aria-label={`Remove ${displayName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
