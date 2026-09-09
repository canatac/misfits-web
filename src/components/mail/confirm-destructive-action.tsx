"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDestructiveActionProps {
  open: boolean;
  title: string;
  message: string;
  count?: number;
  items?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const COUNTDOWN_SECONDS = 3;
const SESSION_STORAGE_KEY = "misfips_skip_destructive_confirm";

export function ConfirmDestructiveAction({
  open,
  title,
  message,
  count,
  items,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
}: ConfirmDestructiveActionProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [skipSession, setSkipSession] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountdown(COUNTDOWN_SECONDS);
      return;
    }

    // Check session storage for skip preference
    try {
      const skip = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (skip === "true") {
        setSkipSession(true);
        // Auto-confirm if skip is enabled
        const timer = setTimeout(() => {
          onConfirm();
        }, 100);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onConfirm]);

  const handleConfirm = useCallback(() => {
    if (skipSession) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      } catch {
        // ignore
      }
    }
    onConfirm();
  }, [skipSession, onConfirm]);

  const handleCancel = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    onCancel();
  }, [onCancel]);

  if (!open) return null;

  const isConfirmDisabled = countdown > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleCancel}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-md bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#A1A1AA] hover:text-white hover:border-[#C49B66]/40 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>

        <p className="text-sm text-[#A1A1AA] mb-4">{message}</p>

        {count !== undefined && count > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]">
            <span className="text-sm text-[#E0E0E0]">
              {count} email{count > 1 ? "s" : ""} concerné{count > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="mb-4 max-h-32 overflow-y-auto p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]">
            {items.slice(0, 5).map((item, index) => (
              <div key={index} className="text-xs text-[#71717A] py-1">
                {item}
              </div>
            ))}
            {items.length > 5 && (
              <div className="text-xs text-[#71717A] py-1">
                ... et {items.length - 5} autre{items.length - 5 > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={skipSession}
            onChange={(e) => setSkipSession(e.target.checked)}
            className="w-4 h-4 rounded border-[#242427] bg-[#0A0A0B] text-[#C49B66] focus:ring-[#C49B66]"
          />
          <span className="text-xs text-[#71717A]">
            Ne plus demander pour cette session
          </span>
        </label>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg text-sm text-[#A1A1AA] border border-[#242427] hover:text-white hover:border-[#C49B66]/40 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isConfirmDisabled
                ? "bg-rose-500/30 text-rose-300/50 cursor-not-allowed"
                : "bg-rose-500 text-white hover:bg-rose-600"
            }`}
          >
            {isConfirmDisabled
              ? `${confirmLabel} dans ${countdown}...`
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useDestructiveConfirmation(threshold = 5) {
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    message: string;
    count?: number;
    items?: string[];
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = useCallback(
    (action: {
      title: string;
      message: string;
      count?: number;
      items?: string[];
      onConfirm: () => void;
    }) => {
      // Only show confirmation if count exceeds threshold
      if (action.count !== undefined && action.count < threshold) {
        action.onConfirm();
        return;
      }
      setPendingAction(action);
    },
    [threshold],
  );

  const handleConfirm = useCallback(() => {
    if (pendingAction) {
      pendingAction.onConfirm();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleCancel = useCallback(() => {
    setPendingAction(null);
  }, []);

  return {
    pendingAction,
    requestConfirmation,
    handleConfirm,
    handleCancel,
  };
}

export default ConfirmDestructiveAction;
