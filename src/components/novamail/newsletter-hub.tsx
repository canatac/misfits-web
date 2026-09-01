"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, Newspaper, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type NewsletterHubState,
  type NewsletterItem,
  type NewsletterTopic,
  loadNewsletterHubState,
  normalizeUrl,
  saveNewsletterHubState,
} from "@/components/novamail/newsletter-hub-state";

const TOPICS: NewsletterTopic[] = [
  "Tech",
  "Finance",
  "Lifestyle",
  "Science",
  "Design",
];

function scoreFromSummary(summary: string): number {
  const sizeBoost = Math.min(15, Math.floor(summary.trim().length / 20));
  return Math.max(50, Math.min(98, 65 + sizeBoost));
}

export function NewsletterHub() {
  const [state, setState] = useState<NewsletterHubState>(() => loadNewsletterHubState());
  const [query, setQuery] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const [contentTitle, setContentTitle] = useState("");
  const [contentSummary, setContentSummary] = useState("");
  const [contentTopic, setContentTopic] = useState<NewsletterTopic>("Tech");
  const [contentLink, setContentLink] = useState("");
  const [contentSourceId, setContentSourceId] = useState(state.sources[0]?.id ?? "");

  const [aiBusy, setAiBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    saveNewsletterHubState(state);
  }, [state]);

  useEffect(() => {
    if (!contentSourceId && state.sources[0]?.id) {
      setContentSourceId(state.sources[0].id);
    }
  }, [contentSourceId, state.sources]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.items;
    return state.items.filter((item) => {
      const source = state.sources.find((s) => s.id === item.sourceId)?.name ?? "";
      return [item.title, item.topic, item.summary, source]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, state.items, state.sources]);

  const handleAddSource = (e: FormEvent) => {
    e.preventDefault();
    const name = sourceName.trim();
    if (!name) {
      setNotice("Nom de source requis.");
      return;
    }

    const exists = state.sources.some((s) => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setNotice("Source déjà existante.");
      return;
    }

    const id = `src-${Date.now()}`;
    const url = normalizeUrl(sourceUrl);
    setState((prev) => ({
      ...prev,
      sources: [{ id, name, url: url || undefined, createdAt: new Date().toISOString() }, ...prev.sources],
    }));
    setContentSourceId(id);
    setSourceName("");
    setSourceUrl("");
    setNotice(`Source ajoutée: ${name}`);
  };

  const handleAddContent = (e: FormEvent) => {
    e.preventDefault();
    const title = contentTitle.trim();
    const summary = contentSummary.trim();
    if (!contentSourceId) {
      setNotice("Ajoute d'abord une source.");
      return;
    }
    if (!title || !summary) {
      setNotice("Titre et résumé requis.");
      return;
    }

    const source = state.sources.find((s) => s.id === contentSourceId);
    const link = normalizeUrl(contentLink) || source?.url || "#";
    const item: NewsletterItem = {
      id: `n-${Date.now()}`,
      sourceId: contentSourceId,
      title,
      topic: contentTopic,
      summary,
      signal: scoreFromSummary(summary),
      links: [{ name: source?.name || "Source", url: link }],
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({ ...prev, items: [item, ...prev.items] }));
    setContentTitle("");
    setContentSummary("");
    setContentLink("");
    setNotice(`Contenu ajouté: ${title}`);
  };

  const handleAiDigest = async () => {
    setAiBusy(true);
    try {
      const context = visible
        .slice(0, 8)
        .map((it) => `- ${it.title} (${it.topic}, signal ${it.signal}%): ${it.summary}`)
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
      const summary = data.content || data.error?.message || "Briefing indisponible (fallback local).";
      const defaultSource = state.sources[0];

      setState((prev) => ({
        ...prev,
        items: [
          {
            id: `ai-${Date.now()}`,
            sourceId: defaultSource?.id ?? "",
            title: "AI Executive Digest",
            topic: "Tech",
            summary,
            signal: 95,
            links: [{ name: "Generated", url: "#" }],
            createdAt: new Date().toISOString(),
          },
          ...prev.items,
        ],
      }));
      setNotice("Digest IA ajouté.");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <section className="h-full overflow-auto p-4 text-[#E4E4E7] md:p-6">
      <header className="mb-4 rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-xs text-[#E9C995]">
          <Newspaper className="h-3.5 w-3.5" /> Newsletters Hub
        </div>
        <h1 className="text-xl font-bold">Signal Center</h1>
        <p className="text-sm text-[#A1A1AA]">Ajoute des sources, puis ajoute du contenu immédiatement.</p>
      </header>

      <div className="mb-2 text-xs text-[#A1A1AA]">Sources actives: {state.sources.length} · Contenus: {state.items.length}</div>
      {notice && <div className="mb-4 text-xs text-[#E9C995]">{notice}</div>}

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par sujet, source, résumé..."
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button onClick={handleAiDigest} disabled={aiBusy} className="gap-2 bg-[#C49B66] text-black hover:bg-[#b58d5a]">
          <Sparkles className="h-4 w-4" /> {aiBusy ? "Génération..." : "AI Digest"}
        </Button>
      </div>

      <form onSubmit={handleAddSource} className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <Input
          aria-label="Nom de la source"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="Nom de source (ex: Stratechery)"
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Input
          aria-label="URL de la source"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="URL source (optionnel)"
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button type="submit" variant="outline" className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]">
          <Plus className="h-4 w-4" /> Ajouter source
        </Button>
      </form>

      <form onSubmit={handleAddContent} className="mb-4 grid gap-2 md:grid-cols-2">
        <Input
          aria-label="Titre du contenu"
          value={contentTitle}
          onChange={(e) => setContentTitle(e.target.value)}
          placeholder="Titre du contenu"
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <select
          aria-label="Source du contenu"
          value={contentSourceId}
          onChange={(e) => setContentSourceId(e.target.value)}
          className="h-10 rounded-md border border-[#2A2A2D] bg-[#141417] px-3 text-sm text-[#E4E4E7]"
        >
          {state.sources.map((src) => (
            <option key={src.id} value={src.id}>
              {src.name}
            </option>
          ))}
        </select>
        <Input
          aria-label="Résumé du contenu"
          value={contentSummary}
          onChange={(e) => setContentSummary(e.target.value)}
          placeholder="Résumé du contenu"
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <div className="grid grid-cols-[1fr_140px] gap-2">
          <Input
            aria-label="Lien du contenu"
            value={contentLink}
            onChange={(e) => setContentLink(e.target.value)}
            placeholder="Lien (optionnel)"
            className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
          />
          <select
            aria-label="Sujet du contenu"
            value={contentTopic}
            onChange={(e) => setContentTopic(e.target.value as NewsletterTopic)}
            className="h-10 rounded-md border border-[#2A2A2D] bg-[#141417] px-3 text-sm text-[#E4E4E7]"
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" variant="outline" className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]">
            <Plus className="h-4 w-4" /> Ajouter contenu
          </Button>
        </div>
      </form>

      <div className="grid gap-3">
        {visible.map((item) => {
          const source = state.sources.find((s) => s.id === item.sourceId);
          return (
            <article key={item.id} className="rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="font-semibold text-white">{item.title}</h2>
                <Badge variant="secondary">{item.topic}</Badge>
                <Badge className="ml-auto bg-[#1E1A15] text-[#F2D5A7]">Signal {item.signal}%</Badge>
              </div>
              <p className="mb-2 text-xs text-[#A1A1AA]">Source: {source?.name ?? "N/A"}</p>
              <p className="text-sm whitespace-pre-wrap text-[#C4C4CC]">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.links.map((l) => (
                  <a key={`${item.id}-${l.name}`} href={l.url} className="inline-flex items-center gap-1 text-xs text-[#E9C995] hover:underline">
                    {l.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
