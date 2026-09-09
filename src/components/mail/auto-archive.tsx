"use client";

import { useState, useCallback, useEffect } from "react";
import { Archive, RotateCcw, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ArchiveAgeOption = "never" | "1m" | "3m" | "6m" | "1y";

interface ArchiveConfig {
  autoArchiveAge: ArchiveAgeOption;
  lastArchiveRun: string | null;
  totalArchived: number;
}

const AGE_OPTIONS: { value: ArchiveAgeOption; label: string; description: string }[] = [
  { value: "never", label: "Jamais", description: "Désarchivage automatique désactivé" },
  { value: "1m", label: "1 mois", description: "Archiver les emails de plus de 1 mois" },
  { value: "3m", label: "3 mois", description: "Archiver les emails de plus de 3 mois" },
  { value: "6m", label: "6 mois", description: "Archiver les emails de plus de 6 mois" },
  { value: "1y", label: "1 an", description: "Archiver les emails de plus de 1 an" },
];

const STORAGE_KEY = "misfits_auto_archive_config";

export function useAutoArchive() {
  const [config, setConfig] = useState<ArchiveConfig>({
    autoArchiveAge: "never",
    lastArchiveRun: null,
    totalArchived: 0,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const updateConfig = useCallback((updates: Partial<ArchiveConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getAgeInDays = useCallback((age: ArchiveAgeOption): number => {
    switch (age) {
      case "1m": return 30;
      case "3m": return 90;
      case "6m": return 180;
      case "1y": return 365;
      default: return 0;
    }
  }, []);

  const shouldArchive = useCallback((emailDate: string, age: ArchiveAgeOption): boolean => {
    if (age === "never") return false;
    const days = getAgeInDays(age);
    const emailTime = new Date(emailDate).getTime();
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return emailTime < cutoffTime;
  }, [getAgeInDays]);

  const runArchive = useCallback((emails: Array<{ id: string; date: string; isRead: boolean }>) => {
    if (config.autoArchiveAge === "never") return [];

    const toArchive = emails.filter((email) => {
      if (!email.isRead) return false;
      return shouldArchive(email.date, config.autoArchiveAge);
    });

    if (toArchive.length > 0) {
      updateConfig({
        lastArchiveRun: new Date().toISOString(),
        totalArchived: config.totalArchived + toArchive.length,
      });
    }

    return toArchive.map((e) => e.id);
  }, [config.autoArchiveAge, config.totalArchived, shouldArchive, updateConfig]);

  return {
    config,
    updateConfig,
    runArchive,
    shouldArchive,
    AGE_OPTIONS,
  };
}

export function AutoArchiveSettings() {
  const { config, updateConfig, runArchive, AGE_OPTIONS } = useAutoArchive();
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleArchiveNow = useCallback(() => {
    setIsRunning(true);
    // Simulate archiving - in real app, this would fetch emails from store
    setTimeout(() => {
      const mockEmails = [
        { id: "1", date: "2024-01-15", isRead: true },
        { id: "2", date: "2024-06-20", isRead: true },
        { id: "3", date: "2025-12-01", isRead: true },
      ];
      const archivedIds = runArchive(mockEmails);
      setLastResult(archivedIds.length);
      setIsRunning(false);
    }, 1000);
  }, [runArchive]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-2">Archivage automatique</h2>
        <p className="text-sm text-[#71717A]">
          Archivez automatiquement les anciens emails pour garder votre boîte de réception propre.
        </p>
      </div>

      <div className="space-y-2">
        {AGE_OPTIONS.map((option) => {
          const isActive = config.autoArchiveAge === option.value;
          return (
            <button
              key={option.value}
              onClick={() => updateConfig({ autoArchiveAge: option.value })}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                isActive
                  ? "bg-[#C49B66]/10 border-[#C49B66]/40"
                  : "bg-[#0A0A0B] border-[#242427] hover:border-[#C49B66]/20"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isActive ? "bg-[#C49B66]/20 text-[#C49B66]" : "bg-[#1D1D20] text-[#71717A]"
                )}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", isActive ? "text-[#C49B66]" : "text-[#E0E0E0]")}>
                    {option.label}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 rounded-full bg-[#C49B66]/20 px-1.5 py-0.5 text-[10px] text-[#C49B66]">
                      <Check className="h-2.5 w-2.5" />
                      Actif
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">{option.description}</p>
              </div>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-colors",
                  isActive ? "border-[#C49B66] bg-[#C49B66]" : "border-[#242427]"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Archive now button */}
      <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[#E0E0E0]">Archiver maintenant</h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Exécuter l'archivage manuellement selon les critères ci-dessus
            </p>
          </div>
          <button
            onClick={handleArchiveNow}
            disabled={isRunning || config.autoArchiveAge === "never"}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
              config.autoArchiveAge === "never"
                ? "bg-[#1D1D20] text-[#71717A] cursor-not-allowed"
                : "bg-[#C49B66] text-white hover:bg-[#C49B66]/80"
            )}
          >
            <Archive className="h-4 w-4" />
            {isRunning ? "Archivage..." : "Archiver"}
          </button>
        </div>
        {lastResult !== null && (
          <p className="mt-2 text-xs text-[#4ADE80]">
            {lastResult} email(s) archivé(s)
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]">
          <p className="text-xs text-[#71717A]">Total archivés</p>
          <p className="text-lg font-bold text-[#E0E0E0]">{config.totalArchived}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]">
          <p className="text-xs text-[#71717A]">Dernière exécution</p>
          <p className="text-sm font-medium text-[#E0E0E0]">
            {config.lastArchiveRun
              ? new Date(config.lastArchiveRun).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })
              : "Jamais"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ArchiveRestoreButton({ emailId, onRestore }: { emailId: string; onRestore?: () => void }) {
  return (
    <button
      onClick={onRestore}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#C49B66] hover:bg-[#C49B66]/10 transition-colors"
    >
      <RotateCcw className="h-3 w-3" />
      Restaurer
    </button>
  );
}

export default AutoArchiveSettings;
