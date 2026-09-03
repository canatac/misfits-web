"use client";

import { Sparkles } from "lucide-react";
import type { DashboardHighlight, DashboardSuggestedNewsItem } from "../types";

function formatPublishedAt(value: string) {
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ts));
}

function formatCategoryLabel(value: DashboardSuggestedNewsItem["category"]) {
  switch (value) {
    case "defaillance":
      return "Défaillance";
    case "capital":
      return "Capital";
    case "bourse":
      return "Bourse";
    case "emploi":
      return "Emploi";
    case "scandale":
      return "Scandale";
    default:
      return value;
  }
}

export function BriefingCard({
  dateLabel,
  badge,
  greeting,
  highlights,
  suggestedNews,
  suggestedNewsLoading,
  children,
}: {
  dateLabel: string;
  badge: string;
  greeting: string;
  highlights: DashboardHighlight[];
  suggestedNews?: DashboardSuggestedNewsItem[];
  suggestedNewsLoading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-[#242427] bg-gradient-to-r from-[#121214] via-[#161619] to-[#121214] p-5 shadow-2xl md:p-6">
      <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-[#C49B66]/10 blur-3xl" />
      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-5">
        <div className="space-y-3">
          {dateLabel && (
            <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#C49B66]">
              {dateLabel}
            </p>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-2.5 py-1 text-[10px] font-semibold text-[#E9C995]">
            <Sparkles className="h-3 w-3" />
            {badge}
          </div>
          <h1 className="max-w-4xl text-lg leading-6 font-semibold text-white md:text-xl md:leading-7">
            {greeting}
          </h1>

          <ul className="grid gap-2 pt-1 sm:grid-cols-2">
            {highlights.map((item) => (
              <li
                key={item.category}
                className="rounded-lg border border-[#2A2A2E] bg-[#111115]/75 px-3 py-2"
              >
                <p className="text-[11px] font-semibold" style={{ color: item.color }}>
                  {item.category}
                </p>
                <p className="mt-0.5 text-[12px] leading-5 text-[#D4D4D8]">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <section className="rounded-xl border border-[#2A2A2E] bg-[#101014]/70 p-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-[#C49B66] uppercase">
            Recommandations d&apos;actualités
          </p>
          {suggestedNewsLoading ? (
            <p className="mt-2 text-[13px] text-[#A1A1AA]">Analyse en cours…</p>
          ) : suggestedNews && suggestedNews.length > 0 ? (
            <ul className="mt-2 space-y-2.5">
              {suggestedNews.map((item) => (
                <li
                  key={`${item.url}-${item.category}`}
                  className="rounded-lg border border-[#28282C] bg-[#121216] px-3 py-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold tracking-wide text-[#9CA3AF] uppercase">
                      {formatCategoryLabel(item.category)}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {item.source} • {formatPublishedAt(item.publishedAt)}
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] font-semibold leading-5 text-[#E4CFA4] underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </a>
                  <p className="mt-1 text-[12px] leading-5 text-[#D4D4D8]">{item.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-[#A1A1AA]">
              Pas d&apos;actualité externe prioritaire identifiée pour le moment.
            </p>
          )}
        </section>
      </div>
      {children}
    </header>
  );
}
