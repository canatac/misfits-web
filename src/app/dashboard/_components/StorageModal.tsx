"use client";

import { RefreshCw, X } from "lucide-react";
import { StorageGauge } from "@/components/dashboard/StorageGauge";

export function StorageModal({
  percentage,
  onClose,
  onCleanUp,
}: {
  percentage: number;
  onClose: () => void;
  onCleanUp: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-modal-title"
        className="w-full max-w-lg rounded-2xl border border-[#242427] bg-[#121214] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="storage-modal-title" className="text-base font-bold text-white">
            StorageGauge — Nettoyage
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#71717A] transition hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-[#242427] bg-[#0A0A0B] p-4">
          <StorageGauge percentage={percentage} />
          <div className="mt-3 space-y-1 text-xs text-[#A1A1AA]">
            <p>Utilisé: 842 Go</p>
            <p>Disponible: 158 Go</p>
            <p>Capacité totale: 1000 Go</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#71717A]">
            Mode critique au-dessus de 80%. Purge recommandée.
          </p>
          <button
            type="button"
            onClick={onCleanUp}
            className="inline-flex items-center gap-1 rounded-xl border border-[#F87171]/40 bg-[#2A1515] px-3 py-2 text-xs font-semibold text-[#F87171] transition hover:bg-[#341919]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Purger l’espace
          </button>
        </div>
      </div>
    </div>
  );
}
