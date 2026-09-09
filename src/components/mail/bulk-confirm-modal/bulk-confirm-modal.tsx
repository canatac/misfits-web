"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const COUNTDOWN_SECONDS = 3;

interface BulkConfirmModalProps {
  open: boolean;
  onConfirm: (skipForSession: boolean) => void;
  onCancel: () => void;
  actionLabel: string;
  emailCount: number;
}

export function BulkConfirmModal({
  open,
  onConfirm,
  onCancel,
  actionLabel,
  emailCount,
}: BulkConfirmModalProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [skipForSession, setSkipForSession] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountdown(COUNTDOWN_SECONDS);
      setSkipForSession(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel]
  );

  if (!open) return null;

  const isDisabled = countdown > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-confirm-title"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-label="Fermer la modale"
      />
      <div className="relative w-full max-w-sm rounded-xl border border-[#242427] bg-[#121214] p-6 shadow-xl">
        <div className="flex items-center gap-3 text-left">
          <div className="rounded-lg bg-[#C49B66]/10 p-2">
            <AlertTriangle className="h-5 w-5 text-[#C49B66]" />
          </div>
          <div>
            <h2
              id="bulk-confirm-title"
              className="text-sm font-semibold text-[#E0E0E0]"
            >
              {actionLabel} × {emailCount} emails ?
            </h2>
            <p className="mt-1 text-xs text-[#71717A]">
              Cette action est irréversible. Confirmez pour continuer.
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-[#D4D4D8]">
          <input
            type="checkbox"
            checked={skipForSession}
            onChange={(e) => setSkipForSession(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[#242427] accent-[#C49B66]"
            aria-label="Ne plus demander pour cette session"
          />
          Ne plus demander pour cette session
        </label>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-[#D4D4D8]"
          >
            Annuler
          </Button>
          <Button
            size="sm"
            disabled={isDisabled}
            onClick={() => onConfirm(skipForSession)}
            className={cn(
              "min-w-[100px] transition-colors",
              isDisabled
                ? "cursor-not-allowed bg-[#242427] text-[#71717A]"
                : "bg-[#C49B66] text-white hover:bg-[#C49B66]/80"
            )}
          >
            {isDisabled ? `Confirmer (${countdown})` : "Confirmer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
