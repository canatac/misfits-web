"use client";

import { useState } from "react";
import { Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Nuance = { phrase: string; explanation: string };

export function TranslationTool() {
  const [source, setSource] = useState(
    "件名: プロジェクト進捗\nこんにちは、チーム。新機能は今週ベータ予定です。",
  );
  const [result, setResult] = useState("");
  const [nuances, setNuances] = useState<Nuance[]>([]);
  const [busy, setBusy] = useState(false);

  const handleTranslate = async () => {
    const text = source.trim();
    if (!text) return;
    setBusy(true);
    try {
      const prompt = [
        "Traduis le texte en français clair.",
        "Puis retourne aussi 3 nuances culturelles/linguistiques importantes.",
        "Format strict:",
        "TRANSLATION:\n...",
        "NUANCES:\n- phrase :: explication",
        "",
        text,
      ].join("\n");

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });

      const data = (await res.json().catch(() => ({}))) as { content?: string; error?: { message?: string } };
      const raw = data.content || "TRANSLATION:\nService indisponible.\nNUANCES:\n- fallback :: Pas de réponse IA.";

      const [translationPart = "", nuancePart = ""] = raw.split("NUANCES:");
      const cleanTranslation = translationPart.replace(/^TRANSLATION:\s*/i, "").trim();
      const extractedNuances = nuancePart
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("-"))
        .map((l) => l.replace(/^-\s*/, ""))
        .map((l) => {
          const [phrase, explanation] = l.split("::").map((x) => x.trim());
          return { phrase: phrase || "nuance", explanation: explanation || "" };
        })
        .slice(0, 5);

      setResult(cleanTranslation || raw);
      setNuances(extractedNuances);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="h-full overflow-auto p-4 md:p-6 text-[#E4E4E7]">
      <header className="mb-4 rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-xs text-[#E9C995]">
          <Languages className="h-3.5 w-3.5" />
          Translation Nuance Lab
        </div>
        <h1 className="text-xl font-bold">Traduction + Nuance</h1>
        <p className="text-sm text-[#A1A1AA]">Traduction fidèle avec détection des subtilités culturelles utiles en contexte pro.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
          <h2 className="mb-2 text-sm font-semibold text-white">Texte source</h2>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-64 w-full rounded-xl border border-[#2A2A2D] bg-[#141417] p-3 text-sm text-[#E4E4E7]"
          />
          <Button onClick={handleTranslate} disabled={busy} className="mt-3 gap-2 bg-[#C49B66] text-black hover:bg-[#b58d5a]">
            <Sparkles className="h-4 w-4" />
            {busy ? "Traduction..." : "Traduire"}
          </Button>
        </div>

        <div className="rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
          <h2 className="mb-2 text-sm font-semibold text-white">Résultat</h2>
          <div className="mb-4 min-h-40 whitespace-pre-wrap rounded-xl border border-[#2A2A2D] bg-[#141417] p-3 text-sm text-[#D4D4D8]">
            {result || "La traduction apparaîtra ici."}
          </div>

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Nuances</h3>
          <div className="space-y-2">
            {nuances.length === 0 ? (
              <p className="text-sm text-[#71717A]">Aucune nuance détectée pour l’instant.</p>
            ) : (
              nuances.map((n, idx) => (
                <div key={`${n.phrase}-${idx}`} className="rounded-xl border border-[#2A2A2D] bg-[#141417] p-3">
                  <div className="text-xs font-semibold text-[#F2D5A7]">{n.phrase}</div>
                  <div className="mt-1 text-sm text-[#C4C4CC]">{n.explanation}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
