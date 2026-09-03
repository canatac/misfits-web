"use client";

import { Newspaper } from "lucide-react";

export function NewsletterHubHeader() {
  return (
    <header className="mb-4 rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-xs text-[#E9C995]">
        <Newspaper className="h-3.5 w-3.5" /> Newsletters Hub
      </div>
      <h1 className="text-xl font-bold">Veille & résumés</h1>
      <p className="text-sm text-[#A1A1AA]">
        Un rendu standardisé, lisible et propre des synthèses: points clés, contexte et
        section Sources vérifiable.
      </p>
    </header>
  );
}
