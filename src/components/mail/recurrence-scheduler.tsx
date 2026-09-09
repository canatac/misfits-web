"use client";

import { useState, useCallback } from "react";
import { Calendar, Clock, Repeat, X, Check, Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "custom";
type RecurrenceEnd = "never" | "after" | "on_date";

interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  endType: RecurrenceEnd;
  endAfterOccurrences?: number;
  endDate?: string;
  nextOccurrence: string;
}

interface RecurringEmail {
  id: string;
  subject: string;
  to: string;
  body: string;
  config: RecurrenceConfig;
  isActive: boolean;
  createdAt: string;
}

interface RecurrenceSchedulerProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: RecurrenceConfig) => void;
  initialConfig?: RecurrenceConfig;
}

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "custom", label: "Personnalisé" },
];

export function RecurrenceScheduler({
  open,
  onClose,
  onSave,
  initialConfig,
}: RecurrenceSchedulerProps) {
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initialConfig?.frequency || "weekly"
  );
  const [interval, setInterval] = useState(initialConfig?.interval || 1);
  const [endType, setEndType] = useState<RecurrenceEnd>(
    initialConfig?.endType || "never"
  );
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(
    initialConfig?.endAfterOccurrences || 10
  );
  const [endDate, setEndDate] = useState(initialConfig?.endDate || "");

  const calculateNextOccurrence = useCallback(() => {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case "daily":
        next.setDate(now.getDate() + interval);
        break;
      case "weekly":
        next.setDate(now.getDate() + interval * 7);
        break;
      case "monthly":
        next.setMonth(now.getMonth() + interval);
        break;
      default:
        next.setDate(now.getDate() + interval);
    }

    return next.toISOString();
  }, [frequency, interval]);

  const handleSave = () => {
    const config: RecurrenceConfig = {
      frequency,
      interval,
      endType,
      endAfterOccurrences: endType === "after" ? endAfterOccurrences : undefined,
      endDate: endType === "on_date" ? endDate : undefined,
      nextOccurrence: calculateNextOccurrence(),
    };
    onSave(config);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Planification de récurrence"
    >
      <div
        className="relative w-full max-w-md bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-[#C49B66]" />
            <h2 className="text-lg font-bold text-white">Planifier la récurrence</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#A1A1AA] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Frequency */}
          <div>
            <label className="text-xs text-[#71717A] mb-2 block">Fréquence</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm transition-colors",
                    frequency === opt.value
                      ? "bg-[#C49B66] text-white"
                      : "bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="text-xs text-[#71717A] mb-2 block">
              Intervalle (tous les {interval} {frequency === "daily" ? "jour(s)" : frequency === "weekly" ? "semaine(s)" : "mois"})
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg bg-[#0A0A0B] border border-[#242427] text-sm text-white outline-none focus:border-[#C49B66]/40"
            />
          </div>

          {/* End type */}
          <div>
            <label className="text-xs text-[#71717A] mb-2 block">Fin de la récurrence</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "never"}
                  onChange={() => setEndType("never")}
                  className="text-[#C49B66]"
                />
                <span className="text-sm text-[#E0E0E0]">Jamais</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "after"}
                  onChange={() => setEndType("after")}
                  className="text-[#C49B66]"
                />
                <span className="text-sm text-[#E0E0E0]">Après</span>
                {endType === "after" && (
                  <input
                    type="number"
                    min={1}
                    value={endAfterOccurrences}
                    onChange={(e) => setEndAfterOccurrences(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 rounded bg-[#0A0A0B] border border-[#242427] text-xs text-white outline-none"
                  />
                )}
                {endType === "after" && <span className="text-xs text-[#71717A]">occurrences</span>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "on_date"}
                  onChange={() => setEndType("on_date")}
                  className="text-[#C49B66]"
                />
                <span className="text-sm text-[#E0E0E0]">Le</span>
                {endType === "on_date" && (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 rounded bg-[#0A0A0B] border border-[#242427] text-xs text-white outline-none"
                  />
                )}
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]">
            <div className="flex items-center gap-2 text-xs text-[#71717A]">
              <Calendar className="h-3 w-3" />
              <span>Prochaine occurrence :</span>
            </div>
            <span className="text-sm text-[#C49B66]">
              {new Date(calculateNextOccurrence()).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[#A1A1AA] border border-[#242427] hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm bg-[#C49B66] text-white hover:bg-[#C49B66]/80"
          >
            Activer la récurrence
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecurringEmailsList({
  emails,
  onPause,
  onResume,
  onDelete,
}: {
  emails: RecurringEmail[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <Repeat className="h-12 w-12 text-[#242427] mx-auto mb-4" />
        <p className="text-sm text-[#71717A]">Aucun email récurrent</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <div
          key={email.id}
          className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                email.isActive ? "bg-emerald-500" : "bg-[#71717A]"
              )}
            />
            <div>
              <p className="text-sm text-[#E0E0E0]">{email.subject}</p>
              <p className="text-xs text-[#71717A]">
                Prochaine :{" "}
                {new Date(email.config.nextOccurrence).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => (email.isActive ? onPause(email.id) : onResume(email.id))}
              className="p-2 rounded-lg text-[#71717A] hover:bg-[#1D1D20] hover:text-white"
              aria-label={email.isActive ? "Pause" : "Reprendre"}
            >
              {email.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onDelete(email.id)}
              className="p-2 rounded-lg text-[#71717A] hover:bg-[#1D1D20] hover:text-rose-400"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecurrenceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-[#C49B66] hover:border-[#C49B66]/40 transition-colors"
      aria-label="Planifier la récurrence"
      title="Récurrence"
    >
      <Repeat className="h-4 w-4" />
    </button>
  );
}

export default RecurrenceScheduler;
