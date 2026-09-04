"use client";

import { Activity, CalendarClock, LoaderCircle } from "lucide-react";
import { useNewsletterHubState } from "./use-newsletter-hub-state";

type NewsletterHubState = ReturnType<typeof useNewsletterHubState>;

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value || 0);
}

export function NewsletterMonitoringCockpit({ state }: { state: NewsletterHubState }) {
  const m = state.monitoring;

  return (
    <section className="mb-4 rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2D] bg-[#141417] px-3 py-1 text-xs text-[#E4E4E7]">
          <Activity className="h-3.5 w-3.5" /> Mini cockpit newsletters
        </div>
        <div className="inline-flex items-center gap-1 text-xs text-[#A1A1AA]">
          <CalendarClock className="h-3.5 w-3.5" />
          Dernière mise à jour: {formatDate(m.updatedAt)}
        </div>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-4">
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">État résumé</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {m.status === "running" ? "En cours" : "Idle"}
            {m.status === "running" ? <LoaderCircle className="ml-2 inline h-4 w-4 animate-spin" /> : null}
          </p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">Dernier résumé</p>
          <p className="mt-1 text-sm font-semibold text-white">{formatDate(m.lastSummaryAt)}</p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">Sources actives</p>
          <p className="mt-1 text-sm font-semibold text-white">{m.activeSources}</p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">Résumés (24h)</p>
          <p className="mt-1 text-sm font-semibold text-white">{m.summaries24h}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">Runs résumé</p>
          <p className="mt-1 text-sm font-semibold text-white">{m.runCount}</p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">En cours</p>
          <p className="mt-1 text-sm font-semibold text-white">{m.runningCount}</p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">Échecs</p>
          <p className="mt-1 text-sm font-semibold text-white">{m.failedCount}</p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">Succès</p>
          <p className="mt-1 text-sm font-semibold text-white">{m.successRate}%</p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <p className="text-[11px] text-[#A1A1AA]">Coût estimé LLM</p>
          <p className="mt-1 text-sm font-semibold text-white">{formatUsd(m.totalCostUsd)}</p>
        </div>
      </div>
    </section>
  );
}
