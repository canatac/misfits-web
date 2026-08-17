"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "../../shared";

export interface CrGuideChatPanelProps {
  qualityChecks: any;
  crGuideMessages: any[];
  crGuideInput: string;
  crGuideLoading: boolean;
  crGuideError: string | null | undefined;
  handleGuideChatSubmit: (e: React.FormEvent) => void;
  applyGuideToForm: () => void;
  setCrGuideInput: (v: string) => void;
}

export function CrGuideChatPanel({
  qualityChecks,
  crGuideMessages,
  crGuideInput,
  crGuideLoading,
  crGuideError,
  handleGuideChatSubmit,
  applyGuideToForm,
  setCrGuideInput,
}: CrGuideChatPanelProps) {
  return (
    <aside className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
          Assistant chat — formulation CR
        </h3>
        <Badge tone={qualityChecks.score >= 4 ? "ok" : "warn"}>
          qualité {qualityChecks.score}/5
        </Badge>
      </div>
      <p className="text-xs text-[#A1A1AA]">
        Discute avec Hermes pour structurer la demande. Il reformule et
        alimente automatiquement le formulaire.
      </p>

      <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
        {crGuideMessages.map((message: any, index: number) => (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "max-w-[92%] rounded-md px-2 py-1.5 text-xs leading-relaxed",
              message.role === "assistant"
                ? "border border-[#2A2A30] bg-[#151518] text-[#D4D4D8]"
                : "ml-auto border border-[#4A3921] bg-[#2A2218] text-[#F2D5A7]"
            )}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form className="mt-2 space-y-2" onSubmit={handleGuideChatSubmit}>
        <textarea
          value={crGuideInput}
          onChange={(e) => setCrGuideInput(e.target.value)}
          className="h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
          placeholder="Réponds au message Hermes (ex: impact, KPI, rollback, etc.)"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={crGuideLoading || !crGuideInput.trim()}
            className="rounded-lg border border-[#C49B66] bg-[#2A2218] px-2.5 py-1.5 text-xs font-semibold text-[#F2D5A7] disabled:opacity-50"
          >
            {crGuideLoading ? "Hermes rédige…" : "Envoyer"}
          </button>
          <button
            type="button"
            onClick={() => applyGuideToForm()}
            className="rounded-lg border border-[#3A3A42] px-2.5 py-1.5 text-xs text-[#D4D4D8]"
          >
            Appliquer au formulaire
          </button>
        </div>
        {crGuideError && (
          <p className="text-xs text-[#FCA5A5]">
            Assistant indisponible: {crGuideError}
          </p>
        )}
      </form>

      <div className="mt-3 rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
        <p className="mb-1 text-[11px] text-[#A1A1AA]">
          Checklist qualité
        </p>
        <div className="space-y-1">
          {qualityChecks.checks.map((check: any) => (
            <p
              key={check.label}
              className={cn(
                "text-xs",
                check.ok ? "text-[#86EFAC]" : "text-[#FCD34D]"
              )}
            >
              {check.ok ? "✓" : "•"} {check.label}
            </p>
          ))}
        </div>
      </div>
    </aside>
  );
}
