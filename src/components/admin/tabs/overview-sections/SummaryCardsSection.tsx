"use client";
import React from "react";
import { Badge } from "../../shared";
import type { ActiveTabScope, SummaryCard } from "./types";

interface SummaryCardsSectionProps {
  activeTab: ActiveTabScope;
  summaryCards: readonly SummaryCard[];
}

export function SummaryCardsSection({
  activeTab,
  summaryCards,
}: SummaryCardsSectionProps) {
  return (
    <>
{(activeTab === "overview" ||
  activeTab === "monitoring" ||
  activeTab === "security") && (
  <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    {summaryCards.map((card) => (
      <article
        key={card.label}
        className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-[#A1A1AA]">{card.label}</span>
          <card.icon className="h-4 w-4 text-[#C49B66]" />
        </div>
        <p className="text-2xl font-semibold text-[#F4F4F5]">
          {card.value}
        </p>
        <p className="mt-1 text-xs text-[#71717A]">{card.note}</p>
      </article>
    ))}
  </section>
)}
    </>
  );
}
