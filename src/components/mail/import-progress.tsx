"use client";

import { useState, useCallback } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ImportProgressProps {
  total: number;
  current: number;
  successes: number;
  failures: number;
  onClose: () => void;
}

export function ImportProgress({
  total,
  current,
  successes,
  failures,
  onClose,
}: ImportProgressProps) {
  const [showDetails, setShowDetails] = useState(false);
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current === total;

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!isComplete && (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-500)]" />
          )}
          {isComplete && (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          )}
          <span className="text-sm text-[var(--color-fg)]">
            {isComplete
              ? `Import terminé: ${successes} réussis, ${failures} échoués`
              : `Import en cours: ${current}/${total} emails`}
          </span>
        </div>
        {isComplete && (
          <button
            onClick={onClose}
            className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
          >
            Fermer
          </button>
        )}
      </div>

      <div
        className="relative h-2 w-full rounded-full bg-[var(--color-muted)] cursor-pointer overflow-hidden"
        onClick={() => setShowDetails(!showDetails)}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression de l'import: ${current}/${total}`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-brand-500)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showDetails && (
        <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-muted-fg)]">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            {successes} réussis
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-rose-500" />
            {failures} échoués
          </span>
          <span>{percentage}%</span>
        </div>
      )}

      {!isComplete && (
        <p className="mt-1 text-[10px] text-[var(--color-muted-fg)]">
          Cliquez sur la barre pour voir les détails
        </p>
      )}
    </div>
  );
}

export function useImportProgress() {
  const [progress, setProgress] = useState<{
    total: number;
    current: number;
    successes: number;
    failures: number;
    isImporting: boolean;
  }>({
    total: 0,
    current: 0,
    successes: 0,
    failures: 0,
    isImporting: false,
  });

  const startImport = useCallback((total: number) => {
    setProgress({
      total,
      current: 0,
      successes: 0,
      failures: 0,
      isImporting: true,
    });
  }, []);

  const updateProgress = useCallback(
    (success: boolean) => {
      setProgress((prev) => ({
        ...prev,
        current: prev.current + 1,
        successes: prev.successes + (success ? 1 : 0),
        failures: prev.failures + (success ? 0 : 1),
        isImporting: prev.current + 1 < prev.total,
      }));
    },
    [],
  );

  const resetProgress = useCallback(() => {
    setProgress({
      total: 0,
      current: 0,
      successes: 0,
      failures: 0,
      isImporting: false,
    });
  }, []);

  return { progress, startImport, updateProgress, resetProgress };
}

export default ImportProgress;
