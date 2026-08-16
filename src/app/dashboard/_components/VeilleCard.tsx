"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight, Newspaper } from "lucide-react";
import { VEILLE } from "../dashboard-fixtures";

export function VeilleCard({
  onOpen,
}: {
  onOpen: (article: (typeof VEILLE)[number]) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-[#4ADE80]" />
          <h2 className="text-sm font-bold text-white">Veille & Presse</h2>
        </div>
        <Link
          href="/newsletters"
          className="flex items-center gap-0.5 text-[11px] font-medium text-[#4ADE80] hover:underline"
        >
          Consulter le Hub <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="flex-1 space-y-2 px-4 py-3">
        {VEILLE.map((article) => (
          <li key={article.id}>
            <button
              type="button"
              onClick={() => onOpen(article)}
              className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-left transition hover:border-[#4ADE80]/60"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-white">{article.title}</span>
                <span className="shrink-0 rounded-sm bg-[#4ADE80]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#4ADE80]">
                  Signal {article.signal}%
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-[#A1A1AA]">{article.summary}</p>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#242427] px-4 py-3">
        <Link
          href="/newsletters"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#4ADE80]/50 hover:bg-[#242427]"
        >
          Ouvrir le hub <ArrowUpRight className="h-3.5 w-3.5 text-[#4ADE80]" />
        </Link>
      </div>
    </div>
  );
}
