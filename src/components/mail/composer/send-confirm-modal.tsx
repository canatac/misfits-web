"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recipient } from "@/types/composer";

export const RECIPIENT_THRESHOLD_KEY = "misfits.recipientThreshold";
export const SKIP_SEND_CONFIRM_KEY = "misfits.skipSendConfirm";
export const DEFAULT_RECIPIENT_THRESHOLD = 10;

export function getRecipientThreshold(): number {
  if (typeof window === "undefined") return DEFAULT_RECIPIENT_THRESHOLD;
  const raw = window.localStorage.getItem(RECIPIENT_THRESHOLD_KEY);
  const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_RECIPIENT_THRESHOLD;
  return parsed;
}

export function setRecipientThreshold(value: number): void {
  if (typeof window === "undefined") return;
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_RECIPIENT_THRESHOLD;
  window.localStorage.setItem(RECIPIENT_THRESHOLD_KEY, String(safe));
}

export function shouldSkipSendConfirm(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SKIP_SEND_CONFIRM_KEY) === "true";
}

export function setSkipSendConfirm(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SKIP_SEND_CONFIRM_KEY, value ? "true" : "false");
}

export interface SendConfirmModalProps {
  open: boolean;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  onConfirm: (skipForSession: boolean) => void;
  onCancel: () => void;
}

function recipientLabel(r: Recipient): string {
  return r.email || r.name || "(unknown recipient)";
}

export function SendConfirmModal({
  open,
  to,
  cc,
  bcc,
  onConfirm,
  onCancel,
}: SendConfirmModalProps) {
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    if (!open) {
      setSkip(false);
      return;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const total = to.length + cc.length + bcc.length;
  const groups: { label: string; recipients: Recipient[] }[] = [
    { label: "To", recipients: to },
    { label: "Cc", recipients: cc },
    { label: "Bcc", recipients: bcc },
  ].filter((g) => g.recipients.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-confirm-title"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-[#242427] bg-[#121214] p-6 shadow-xl">
        <div className="flex items-center gap-3 text-left">
          <div className="rounded-lg bg-[#C49B66]/10 p-2">
            <AlertTriangle className="h-5 w-5 text-[#C49B66]" />
          </div>
          <div>
            <h2
              id="send-confirm-title"
              className="text-sm font-semibold text-[#E0E0E0]"
            >
              You&apos;re sending to {total} recipients
            </h2>
            <p className="mt-1 text-xs text-[#71717A]">
              This message will be sent to more than {getRecipientThreshold()} people. Confirm to send.
            </p>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[#242427] bg-[#0A0A0B] p-3">
          {groups.length === 0 ? (
            <p className="text-xs text-[#71717A]">No recipients.</p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-3 last:mb-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#71717A]">
                  {group.label} ({group.recipients.length})
                </p>
                <ul className="space-y-0.5">
                  {group.recipients.map((r) => (
                    <li
                      key={r.id}
                      className="truncate text-xs text-[#D4D4D8]"
                      title={recipientLabel(r)}
                    >
                      {recipientLabel(r)}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-[#D4D4D8]">
          <input
            type="checkbox"
            checked={skip}
            onChange={(e) => setSkip(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[#242427] accent-[#C49B66]"
            aria-label="Don't ask again"
          />
          Don&apos;t ask again
        </label>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-[#D4D4D8]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(skip)}
            className="bg-[#C49B66] text-white hover:bg-[#C49B66]/80"
          >
            Confirm send
          </Button>
        </div>
      </div>
    </div>
  );
}
