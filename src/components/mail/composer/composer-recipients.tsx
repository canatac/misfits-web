"use client";

/**
 * Composer recipient fields (To/Cc/Bcc) with the toggle button.
 * Extracted from composer-panel.tsx to keep files under 250 LOC.
 */
import { Separator } from "@/components/ui/separator";
import { RecipientInput } from "@/components/mail/recipient-input";
import type { Recipient, RecipientType } from "@/types/composer";

interface ComposerRecipientsProps {
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  showCcBcc: boolean;
  onShowCcBcc: () => void;
  onAdd: (t: RecipientType) => (r: Recipient) => void;
  onRemove: (t: RecipientType) => (id: string) => void;
}

export function ComposerRecipients({
  to,
  cc,
  bcc,
  showCcBcc,
  onShowCcBcc,
  onAdd,
  onRemove,
}: ComposerRecipientsProps) {
  const showCcBccToggle = cc.length > 0 || bcc.length > 0 || showCcBcc;
  return (
    <>
      <RecipientInput
        type="to"
        label="To"
        recipients={to}
        onAdd={onAdd("to")}
        onRemove={onRemove("to")}
        autoFocus
      />
      {showCcBccToggle && (
        <>
          <Separator />
          <RecipientInput
            type="cc"
            label="Cc"
            recipients={cc}
            onAdd={onAdd("cc")}
            onRemove={onRemove("cc")}
          />
          <Separator />
          <RecipientInput
            type="bcc"
            label="Bcc"
            recipients={bcc}
            onAdd={onAdd("bcc")}
            onRemove={onRemove("bcc")}
          />
        </>
      )}
      {!showCcBcc && (
        <button
          type="button"
          onClick={onShowCcBcc}
          className="self-end px-3 py-1 text-xs text-[var(--color-brand-500)] hover:underline"
        >
          + Cc / Bcc
        </button>
      )}
    </>
  );
}
