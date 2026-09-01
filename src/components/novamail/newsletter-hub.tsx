"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, Newspaper, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createNewsletterItem,
  createNewsletterSource,
  listNewsletterItems,
  listNewsletterSources,
} from "@/lib/newsletters-api";
import type {
  NewsletterItem,
  NewsletterSource,
  NewsletterTopic,
} from "@/types/newsletters";

const TOPICS: NewsletterTopic[] = [
  "Tech",
  "Finance",
  "Lifestyle",
  "Science",
  "Design",
];

export function NewsletterHub() {
  const [sources, setSources] = useState<NewsletterSource[]>([]);
  const [items, setItems] = useState<NewsletterItem[]>([]);
  const [query, setQuery] = useState("");

  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const [contentTitle, setContentTitle] = useState("");
  const [contentSummary, setContentSummary] = useState("");
  const [contentTopic, setContentTopic] = useState<NewsletterTopic>("Tech");
  const [contentLink, setContentLink] = useState("");
  const [contentSourceId, setContentSourceId] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadFromServer = async () => {
    setLoading(true);
    try {
      const [serverSources, serverItems] = await Promise.all([
        listNewsletterSources(),
        listNewsletterItems(),
      ]);
      setSources(serverSources);
      setItems(serverItems);
      if (!contentSourceId && serverSources[0]?.id) {
        setContentSourceId(serverSources[0].id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Chargement impossible: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const source = sources.find((s) => s.id === item.sourceId)?.name ?? "";
      return [item.title, item.topic, item.summary, source]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, sources]);

  const handleAddSource = async (e: FormEvent) => {
    e.preventDefault();
    const name = sourceName.trim();
    if (!name) {
      setNotice("Nom de source requis.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createNewsletterSource({
        name,
        url: sourceUrl.trim() || undefined,
      });
      setSourceName("");
      setSourceUrl("");
      setContentSourceId(created.id);
      setNotice(`Source ajoutée: ${created.name}`);
      await loadFromServer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Échec ajout source: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContent = async (e: FormEvent) => {
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

    setSubmitting(true);
    try {
      await createNewsletterItem({
        sourceId: contentSourceId,
        title,
        summary,
        topic: contentTopic,
        link: contentLink.trim() || undefined,
      });
      setContentTitle("");
      setContentSummary("");
      setContentLink("");
      setNotice(`Contenu ajouté: ${title}`);
      await loadFromServer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Échec ajout contenu: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiDigest = async () => {
    setAiBusy(true);
    try {
      const context = visible
        .slice(0, 8)
        .map(
          (it) => `- ${it.title} (${it.topic}, signal ${it.signal}%): ${it.summary}`
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

      let sourceId = contentSourceId;
      if (!sourceId) {
        const aiSource = await createNewsletterSource({ name: "AI Digest" });
        sourceId = aiSource.id;
      }

      await createNewsletterItem({
        sourceId,
        title: "AI Executive Digest",
        summary,
        topic: "Tech",
        signal: 95,
      });
      setNotice("Digest IA ajouté.");
      await loadFromServer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Digest IA indisponible: ${msg}`);
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
        <p className="text-sm text-[#A1A1AA]">
          Ajoute des sources et du contenu, stockés côté serveur.
        </p>
      </header>

      <div className="mb-2 text-xs text-[#A1A1AA]">
        Sources actives: {sources.length} · Contenus: {items.length}
      </div>
      {notice && <div className="mb-4 text-xs text-[#E9C995]">{notice}</div>}

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par sujet, source, résumé..."
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button
          onClick={handleAiDigest}
          disabled={aiBusy || loading}
          className="gap-2 bg-[#C49B66] text-black hover:bg-[#b58d5a]"
        >
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
        <Button
          type="submit"
          disabled={submitting || loading}
          variant="outline"
          className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
        >
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
          <option value="">Sélectionner une source</option>
          {sources.map((src) => (
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
          <Button
            type="submit"
            disabled={submitting || loading}
            variant="outline"
            className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
          >
            <Plus className="h-4 w-4" /> Ajouter contenu
          </Button>
        </div>
      </form>

      {loading ? <p className="text-sm text-[#A1A1AA]">Chargement serveur...</p> : null}

      <div className="grid gap-3">
        {visible.map((item) => {
          const source = sources.find((s) => s.id === item.sourceId);
          return (
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
              <p className="mb-2 text-xs text-[#A1A1AA]">Source: {source?.name ?? "N/A"}</p>
              <p className="text-sm whitespace-pre-wrap text-[#C4C4CC]">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.links.map((l) => (
                  <a
                    key={`${item.id}-${l.name}-${l.url}`}
                    href={l.url}
                    className="inline-flex items-center gap-1 text-xs text-[#E9C995] hover:underline"
                  >
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
