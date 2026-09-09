"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "misfits_immersive_reading";

export function useImmersiveReading() {
  const [isActive, setIsActive] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

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
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setIsActive((prev) => {
          const next = !prev;
          localStorage.setItem(STORAGE_KEY, String(next));
          return next;
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleImmersive = useCallback(() => {
    setIsActive((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setReadingProgress(progress);
  }, []);

  return {
    isActive,
    toggleImmersive,
    readingProgress,
    updateProgress,
  };
}

export function ImmersiveReadingBanner({ onExit }: { onExit: () => void }) {
  if (typeof window === "undefined") return null;

  const isActive = localStorage.getItem(STORAGE_KEY) === "true";

  if (!isActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B] border-b border-[#242427] px-4 py-2 flex items-center justify-center gap-2">
      <BookOpen className="h-4 w-4 text-[#C49B66]" />
      <span className="text-sm font-medium text-white">Mode lecture immersive</span>
      <button
        onClick={onExit}
        className="absolute right-4 p-1 rounded hover:bg-[#1D1D20] text-[#71717A] hover:text-white"
        aria-label="Quitter le mode lecture"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ImmersiveReadingButton({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg border transition-colors",
        isActive
          ? "bg-[#C49B66]/20 border-[#C49B66]/40 text-[#C49B66]"
          : "bg-[#1D1D20] border-[#242427] text-[#71717A] hover:text-[#C49B66] hover:border-[#C49B66]/40"
      )}
      aria-label="Mode lecture immersive"
      title="Mode lecture (Ctrl+Shift+R)"
    >
      <BookOpen className="h-4 w-4" />
    </button>
  );
}

export function ReadingProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-1 bg-[#1D1D20]">
      <div
        className="h-full bg-[#C49B66] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
      {progress > 10 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="absolute right-4 -top-8 p-2 rounded-full bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-white"
          aria-label="Retour en haut"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ImmersiveReadingProvider({
  children,
  contentRef,
}: {
  children: React.ReactNode;
  contentRef?: React.RefObject<HTMLElement | null>;
}) {
  const { isActive, toggleImmersive, updateProgress } = useImmersiveReading();

  useEffect(() => {
    if (!isActive || !contentRef?.current) return;

    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;

      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      updateProgress(progress);
    };

    const el = contentRef.current;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isActive, contentRef, updateProgress]);

  return (
    <div className={isActive ? "immersive-reading" : ""}>
      <ImmersiveReadingBanner onExit={toggleImmersive} />
      {isActive && <ReadingProgressBar progress={0} />}
      {children}
    </div>
  );
}

export default ImmersiveReadingProvider;
