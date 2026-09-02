"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createNewsletterItem,
  createNewsletterSource,
  deleteNewsletterSource,
  listNewsletterItems,
  listNewsletterSources,
  updateNewsletterSource,
} from "@/lib/newsletters-api";
import type {
  NewsletterItem,
  NewsletterSource,
  NewsletterTopic,
} from "@/types/newsletters";

const TOPICS: NewsletterTopic[] = ["Tech", "Finance", "Lifestyle", "Science", "Design"];

function normalizeHttpUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function inferSourceName(rawUrl: string): string {
  const url = normalizeHttpUrl(rawUrl);
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || "Source";
  } catch {
    return "Source";
  }
}

export function NewsletterHub() {
  const [sources, setSources] = useState<NewsletterSource[]>([]);
  const [items, setItems] = useState<NewsletterItem[]>([]);
  const [query, setQuery] = useState("");

  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceName, setEditingSourceName] = useState("");
  const [editingSourceUrl, setEditingSourceUrl] = useState("");

  const [contentTitle, setContentTitle] = useState("");
  const [contentSummary, setContentSummary] = useState("");
  const [contentTopic, setContentTopic] = useState<NewsletterTopic>("Tech");
  const [contentLink, setContentLink] = useState("");
  const [contentSourceId, setContentSourceId] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingSourceId, setSavingSourceId] = useState<string | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
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
      return [item.title, item.topic, item.summary, source].join(" ").toLowerCase().includes(q);
    });
  }, [items, query, sources]);

  const handleAddSource = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedUrl = normalizeHttpUrl(sourceUrl);
    if (!normalizedUrl) {
      setNotice("URL source requise.");
      return;
    }
    const label = sourceName.trim() || inferSourceName(normalizedUrl);

    setSubmitting(true);
    try {
      const created = await createNewsletterSource({ name: label, url: normalizedUrl });
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

  const startEditSource = (src: NewsletterSource) => {
    setEditingSourceId(src.id);
    setEditingSourceName(src.name);
    setEditingSourceUrl(src.url ?? "");
    setNotice(null);
  };

  const cancelEditSource = () => {
    setEditingSourceId(null);
    setEditingSourceName("");
    setEditingSourceUrl("");
  };

  const handleUpdateSource = async (sourceId: string) => {
    const normalizedUrl = normalizeHttpUrl(editingSourceUrl);
    if (!normalizedUrl) {
      setNotice("URL source requise.");
      return;
    }
    const label = editingSourceName.trim() || inferSourceName(normalizedUrl);

    setSavingSourceId(sourceId);
    try {
      await updateNewsletterSource(sourceId, {
        name: label,
        url: normalizedUrl,
      });
      setNotice("Source mise à jour.");
      cancelEditSource();
      await loadFromServer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Échec mise à jour source: ${msg}`);
    } finally {
      setSavingSourceId(null);
    }
  };

  const handleDeleteSource = async (src: NewsletterSource) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        `Supprimer la source '${src.name}' ? Les résumés liés seront retirés.`
      );
      if (!ok) return;
    }

    setDeletingSourceId(src.id);
    try {
      await deleteNewsletterSource(src.id);
      if (contentSourceId === src.id) {
        const fallback = sources.find((s) => s.id !== src.id)?.id ?? "";
        setContentSourceId(fallback);
      }
      if (editingSourceId === src.id) {
        cancelEditSource();
      }
      setNotice(`Source supprimée: ${src.name}`);
      await loadFromServer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Échec suppression source: ${msg}`);
    } finally {
      setDeletingSourceId(null);
    }
  };

  const handleAddContent = async (e: FormEvent) => {
    e.preventDefault();
    const title = contentTitle.trim();
    const summary = contentSummary.trim();
    if (!contentSourceId) {
      setNotice("Ajoute d'abord une source URL.");
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
      setNotice(`Résumé ajouté: ${title}`);
      await loadFromServer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Échec ajout résumé: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiDigest = async () => {
    if (sources.length === 0) {
      setNotice("Ajoute au moins une source URL avant de générer un digest.");
      return;
    }

    setAiBusy(true);
    try {
      const sourceContext = sources
        .slice(0, 12)
        .map((src) => `- ${src.name}: ${src.url ?? "URL non renseignée"}`)
        .join("\n");
      const recentContext = visible
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
                "Tu es un assistant de veille. Produis un résumé exécutif en français: 5 points max puis 3 actions recommandées. Base-toi sur ces URL de sources puis le contexte existant.\n\nSources:\n" +
                sourceContext +
                "\n\nContexte récent:\n" +
                (recentContext || "(vide)"),
            },
          ],
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        content?: string;
        error?: { message?: string };
      };
      const summary =
        data.content || data.error?.message || "Briefing indisponible (fallback local).";

      const selectedSourceId = contentSourceId || sources[0]?.id;
      if (!selectedSourceId) {
        setNotice("Aucune source disponible pour enregistrer le digest.");
        return;
      }

      await createNewsletterItem({
        sourceId: selectedSourceId,
        title: "AI Executive Digest",
        summary,
        topic: "Tech",
        signal: 95,
      });
      setNotice("Digest IA ajouté (visible dans le tableau de bord)." );
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
        <h1 className="text-xl font-bold">Sources URL & résumés</h1>
        <p className="text-sm text-[#A1A1AA]">
          1) Ajoute des URL de sources. 2) Mets à jour/supprime tes sources. 3) Génére des résumés affichés dans le tableau de bord.
        </p>
      </header>

      <div className="mb-2 text-xs text-[#A1A1AA]">
        Sources actives: {sources.length} · Résumés: {items.length}
      </div>
      {notice && <div className="mb-4 text-xs text-[#E9C995]">{notice}</div>}

      <div className="mb-4 rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Sources d’information (URL)</h2>

        <form onSubmit={handleAddSource} className="mb-3 grid gap-2 md:grid-cols-[220px_1fr_auto]">
          <Input
            aria-label="Nom de la source"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Nom (optionnel)"
            className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
          />
          <Input
            aria-label="URL de la source"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://exemple.com/feed"
            className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
          />
          <Button
            type="submit"
            disabled={submitting || loading}
            variant="outline"
            className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
          >
            <Plus className="h-4 w-4" /> Ajouter URL
          </Button>
        </form>

        <div className="space-y-2">
          {sources.length === 0 ? (
            <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs text-[#71717A]">
              Aucune source URL pour le moment.
            </p>
          ) : (
            sources.map((src) => {
              const isEditing = editingSourceId === src.id;
              return (
                <div
                  key={src.id}
                  className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3"
                >
                  {isEditing ? (
                    <div className="grid gap-2 md:grid-cols-[220px_1fr_auto_auto]">
                      <Input
                        aria-label="Nom source édition"
                        value={editingSourceName}
                        onChange={(e) => setEditingSourceName(e.target.value)}
                        placeholder="Nom"
                        className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
                      />
                      <Input
                        aria-label="URL source édition"
                        value={editingSourceUrl}
                        onChange={(e) => setEditingSourceUrl(e.target.value)}
                        placeholder="https://exemple.com/feed"
                        className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
                      />
                      <Button
                        type="button"
                        disabled={savingSourceId === src.id}
                        onClick={() => void handleUpdateSource(src.id)}
                        variant="outline"
                        className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
                      >
                        <Save className="h-4 w-4" /> Enregistrer
                      </Button>
                      <Button
                        type="button"
                        onClick={cancelEditSource}
                        variant="outline"
                        className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
                      >
                        <X className="h-4 w-4" /> Annuler
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{src.name}</p>
                        {src.url ? (
                          <a
                            href={src.url}
                            className="inline-flex items-center gap-1 text-xs text-[#E9C995] hover:underline"
                          >
                            {src.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-[#71717A]">URL non renseignée</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => startEditSource(src)}
                          variant="outline"
                          className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
                        >
                          <Pencil className="h-4 w-4" /> Modifier
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void handleDeleteSource(src)}
                          disabled={deletingSourceId === src.id}
                          variant="outline"
                          className="gap-2 border-[#3A2626] bg-[#1A1212] text-[#F8B4B4] hover:bg-[#241515]"
                        >
                          <Trash2 className="h-4 w-4" /> Supprimer
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer les résumés par sujet, source, texte..."
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button
          onClick={handleAiDigest}
          disabled={aiBusy || loading}
          className="gap-2 bg-[#C49B66] text-black hover:bg-[#b58d5a]"
        >
          <Sparkles className="h-4 w-4" /> {aiBusy ? "Génération..." : "Générer un digest"}
        </Button>
      </div>

      <details className="mb-4 rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">
          Ajout manuel d’un résumé (option avancée)
        </summary>
        <form onSubmit={handleAddContent} className="mt-3 grid gap-2 md:grid-cols-2">
          <Input
            aria-label="Titre du contenu"
            value={contentTitle}
            onChange={(e) => setContentTitle(e.target.value)}
            placeholder="Titre du résumé"
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
            placeholder="Résumé"
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
              <Plus className="h-4 w-4" /> Ajouter résumé
            </Button>
          </div>
        </form>
      </details>

      {loading ? <p className="text-sm text-[#A1A1AA]">Chargement serveur...</p> : null}

      <div className="grid gap-3">
        {visible.map((item) => {
          const source = sources.find((s) => s.id === item.sourceId);
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
