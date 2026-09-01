"use client";

import { Sparkles } from "lucide-react";
import type { DashboardHighlight } from "../types";

export function BriefingCard({
  dateLabel,
  badge,
  greeting,
  highlights,
  children,
}: {
  dateLabel: string;
  badge: string;
  greeting: string;
  highlights: DashboardHighlight[];
  children?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-[#242427] bg-gradient-to-r from-[#121214] via-[#161619] to-[#121214] p-6 shadow-2xl">
      <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-[#C49B66]/10 blur-3xl" />
      <div className="relative z-10 space-y-3">
        {dateLabel && (
          <p className="font-mono text-[11px] font-semibold tracking-widest text-[#C49B66]">
            {dateLabel}
          </p>
        )}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-[11px] font-semibold text-[#E9C995]">
          <Sparkles className="h-3.5 w-3.5" />
          {badge}
        </div>
        <h1 className="text-2xl font-bold text-white">{greeting}</h1>
        <ul className="space-y-1 pt-1">
          {highlights.map((item) => (
            <li key={item.category} className="flex items-start gap-2 text-sm">
              <span
                className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>
                <span className="font-semibold" style={{ color: item.color }}>
                  {item.category} :
                </span>{" "}
                <span className="text-[#D4D4D8]">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {children}
    </header>
  );
}
