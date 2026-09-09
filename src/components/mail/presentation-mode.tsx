"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Monitor, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "misfits_presentation_mode";

export function usePresentationMode() {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsActive(true);
      }
    } catch {
      // ignore
    }

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        togglePresentationMode();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const togglePresentationMode = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      localStorage.setItem(STORAGE_KEY, "false");
      return;
    }

    // Start countdown
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsActive(true);
          localStorage.setItem(STORAGE_KEY, "true");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isActive]);

  const cancelCountdown = useCallback(() => {
    setCountdown(0);
  }, []);

  return {
    isActive,
    countdown,
    togglePresentationMode,
    cancelCountdown,
  };
}

export function PresentationModeBanner({ onExit }: { onExit: () => void }) {
  if (typeof window === "undefined") return null;

  const isActive = localStorage.getItem(STORAGE_KEY) === "true";

  if (!isActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#C49B66] text-[#0A0A0B] px-4 py-2 flex items-center justify-center gap-2">
      <EyeOff className="h-4 w-4" />
      <span className="text-sm font-medium">Mode présentation actif</span>
      <button
        onClick={onExit}
        className="absolute right-4 p-1 rounded hover:bg-black/10 transition-colors"
        aria-label="Quitter le mode présentation"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PresentationModeButton({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg border transition-colors",
        isActive
          ? "bg-[#C49B66]/20 border-[#C49B66]/40 text-[#C49B66]"
          : "bg-[#1D1D20] border-[#242427] text-[#71717A] hover:text-[#C49B66] hover:border-[#C49B66]/40"
      )}
      aria-label="Mode présentation"
      title="Mode présentation (Ctrl+Shift+P)"
    >
      {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

export function PresentationModeOverlay({
  countdown,
  onCancel,
}: {
  countdown: number;
  onCancel: () => void;
}) {
  if (countdown <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <Monitor className="h-16 w-16 text-[#C49B66] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Mode présentation</h2>
        <p className="text-[#A1A1AA] mb-6">Les données sensibles seront masquées</p>
        <div className="text-6xl font-bold text-[#C49B66] mb-6">{countdown}</div>
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-lg bg-[#1D1D20] border border-[#242427] text-white hover:bg-[#242427] transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

export function PresentationModeProvider({ children }: { children: React.ReactNode }) {
  const { isActive, countdown, togglePresentationMode, cancelCountdown } = usePresentationMode();

  return (
    <div className={isActive ? "presentation-mode" : ""}>
      <PresentationModeBanner onExit={togglePresentationMode} />
      {countdown > 0 && (
        <PresentationModeOverlay countdown={countdown} onCancel={cancelCountdown} />
      )}
      {children}
    </div>
  );
}

export default PresentationModeProvider;
