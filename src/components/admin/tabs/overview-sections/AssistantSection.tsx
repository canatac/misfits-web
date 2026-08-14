"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "../../shared";
import type { ActiveTabScope } from "./types";

interface AssistantSectionProps {
  activeTab: ActiveTabScope;
  assistantLoading: boolean;
  assistantPrompt: string;
  setAssistantPrompt: (v: string) => void;
  assistantAnswer: string;
  assistantError: string | null;
  askHermesForAdminPlan: () => void;
}

export function AssistantSection({
  activeTab,
  assistantLoading,
  assistantPrompt,
  setAssistantPrompt,
  assistantAnswer,
  assistantError,
  askHermesForAdminPlan,
}: AssistantSectionProps) {
  return (
    <>
{(activeTab === "overview" ||
  activeTab === "monitoring" ||
  activeTab === "security") && (
  <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-[#E4E4E7]">
        Assistant Hermes — administration serveur
      </h2>
      <Badge tone={assistantLoading ? "warn" : "ok"}>
        {assistantLoading ? "analyse…" : "prêt"}
      </Badge>
    </div>
    <p className="mb-3 text-xs text-[#A1A1AA]">
      Décris ton besoin (résumé incident, plan d’action, priorisation) et
      Hermes te renvoie un résumé + une checklist d’actions à exécuter.
    </p>

    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void askHermesForAdminPlan();
      }}
    >
      <textarea
        value={assistantPrompt}
        onChange={(event) => setAssistantPrompt(event.target.value)}
        placeholder="Ex: Résume la situation et propose les actions P0/P1 pour stabiliser SMTP/IMAP dans les 2h."
        className="min-h-[96px] w-full rounded-xl border border-[#2B2B31] bg-[#151518] px-3 py-2 text-sm text-[#E4E4E7] outline-none placeholder:text-[#71717A] focus:border-[#C49B66]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={assistantLoading}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            assistantLoading
              ? "cursor-not-allowed border-[#3A3A42] bg-[#1B1B1F] text-[#71717A]"
              : "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7] hover:bg-[#312718]"
          )}
        >
          {assistantLoading ? "Hermes réfléchit…" : "Demander à Hermes"}
        </button>
        {assistantError && (
          <span className="text-xs text-[#FCA5A5]">{assistantError}</span>
        )}
      </div>
    </form>

    <div className="mt-3 rounded-xl border border-[#232327] bg-[#151518] p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-[#A1A1AA] uppercase">
        Réponse Hermes
      </p>
      {assistantAnswer ? (
        <pre className="text-xs leading-relaxed break-words whitespace-pre-wrap text-[#D4D4D8]">
          {assistantAnswer}
        </pre>
      ) : (
        <p className="text-xs text-[#71717A]">
          Aucune réponse pour le moment.
        </p>
      )}
    </div>
  </section>
)}
    </>
  );
}
