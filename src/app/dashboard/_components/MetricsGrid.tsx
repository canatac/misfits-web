"use client";

import type { LucideIcon } from "lucide-react";
import { HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageGauge } from "@/components/dashboard/StorageGauge";

export type Metric = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: string;
};

export function MetricsGrid({
  metrics,
  storagePercentage,
  onOpenStorage,
}: {
  metrics: Metric[];
  storagePercentage: number;
  onOpenStorage: () => void;
}) {
  return (
    <div className="mt-5 grid gap-2 border-t border-[#242427] pt-4 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="rounded-xl border border-[#242427] bg-[#1D1D20]/70 p-3"
          >
            <div className="mb-1 flex items-center justify-between text-[11px] text-[#71717A]">
              <span>{m.label}</span>
              <Icon className={cn("h-3.5 w-3.5", m.tone)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{m.value}</span>
            </div>
            <div className="text-[10px] text-[#71717A]">{m.note}</div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onOpenStorage}
        className="rounded-xl border border-[#242427] bg-[#1D1D20]/70 p-3 text-left transition hover:border-[#F87171]/40"
      >
        <div className="mb-1 flex items-center justify-between text-[11px] text-[#71717A]">
          <span className="inline-flex items-center gap-1">
            <HardDrive className="h-3.5 w-3.5 text-[#F87171]" /> Stockage
          </span>
          {storagePercentage >= 80 && (
            <span className="rounded-sm bg-[#F87171]/20 px-1 py-0.5 text-[9px] font-bold text-[#F87171] uppercase">
              Critique
            </span>
          )}
        </div>
        <StorageGauge percentage={storagePercentage} compact />
      </button>
    </div>
  );
}
