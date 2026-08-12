"use client";

import { useMemo, useState } from "react";
import { Newspaper, Plus, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type NewsletterItem = {
  id: string;
  title: string;
  topic: "Tech" | "Finance" | "Lifestyle" | "Science" | "Design";
  summary: string;
  signal: number;
  links: Array<{ name: string; url: string }>;
};

const SEED: NewsletterItem[] = [
  {
    id: "n1",
    title: "The Byte Report",
    topic: "Tech",
    summary: "Coverage IA produits, agents autonomes, et tendances infra.",
    signal: 92,
    links: [{ name: "Source", url: "#" }],
  },
  {
    id: "n2",
    title: "Market Edge",
    topic: "Finance",
    summary: "Volatilité macro, rendements, et impact sur le risque projet.",
    signal: 84,
    links: [{ name: "Source", url: "#" }],
  },
];

export function NewsletterHub() {
  const [items, setItems] = useState<NewsletterItem[]>(SEED);
  const [query, setQuery] = useState("");
  const [newSource, setNewSource] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.title, it.topic, it.summary].join(" ").toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleAddSource = () => {
    const src = newSource.trim();
    if (!src) return;
    const id = `n-${Date.now()}`;
    setItems((prev) => [
      {
        id,
        title: src,
        topic: "Tech",
        summary: "Nouvelle source ajoutée. Résumé IA en attente.",
        signal: 70,
        links: [{ name: src, url: "#" }],
      },
      ...prev,
    ]);
    setNewSource("");
  };

  const handleAiDigest = async () => {
    setAiBusy(true);
    try {
      const context = visible
        .slice(0, 8)
        .map(
          (it) =>
            `- ${it.title} (${it.topic}, signal ${it.signal}%): ${it.summary}`
        )
        .join("\n");

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                "Fais un briefing newsletter en français: 5 puces max, puis 3 actions recommandées.\n\n" +
                context,
            },
          ],
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        content?: string;
        error?: { message?: string };
      };
      const summary =
        data.content ||
        data.error?.message ||
        "Briefing indisponible (fallback local).";

      setItems((prev) => [
        {
          id: `ai-${Date.now()}`,
          title: "AI Executive Digest",
          topic: "Tech",
          summary,
          signal: 95,
          links: [{ name: "Generated", url: "#" }],
        },
        ...prev,
      ]);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <section className="h-full overflow-auto p-4 text-[#E4E4E7] md:p-6">
      <header className="mb-4 rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-xs text-[#E9C995]">
          <Newspaper className="h-3.5 w-3.5" />
          Newsletters Hub
        </div>
        <h1 className="text-xl font-bold">Signal Center</h1>
        <p className="text-sm text-[#A1A1AA]">
          Agrège les sources, filtre le bruit, et génère un digest actionnable.
        </p>
      </header>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par sujet, source, résumé..."
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button
          onClick={handleAiDigest}
          disabled={aiBusy}
          className="gap-2 bg-[#C49B66] text-black hover:bg-[#b58d5a]"
        >
          <Sparkles className="h-4 w-4" />
          {aiBusy ? "Génération..." : "AI Digest"}
        </Button>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          placeholder="Ajouter une source (ex: Stratechery, TechCrunch Daily...)"
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button
          onClick={handleAddSource}
          variant="outline"
          className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <div className="grid gap-3">
        {visible.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#242427] bg-[#101012]/95 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-semibold text-white">{item.title}</h2>
              <Badge variant="secondary">{item.topic}</Badge>
              <Badge className="ml-auto bg-[#1E1A15] text-[#F2D5A7]">
                Signal {item.signal}%
              </Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap text-[#C4C4CC]">
              {item.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.links.map((l) => (
                <a
                  key={`${item.id}-${l.name}`}
                  href={l.url}
                  className="inline-flex items-center gap-1 text-xs text-[#E9C995] hover:underline"
                >
                  {l.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
