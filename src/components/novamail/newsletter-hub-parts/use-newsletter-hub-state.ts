"use client";

import { useEffect, useMemo, useState } from "react";
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
import { inferSourceName, normalizeHttpUrl } from "./newsletter-hub-utils";

export function useNewsletterHubState() {
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

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const source = sources.find((s) => s.id === item.sourceId)?.name ?? "";
      return [item.title, item.topic, item.summary, source].join(" ").toLowerCase().includes(q);
    });
  }, [items, query, sources]);

  const addSource = async () => {
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

  const updateSource = async (sourceId: string) => {
    const normalizedUrl = normalizeHttpUrl(editingSourceUrl);
    if (!normalizedUrl) {
      setNotice("URL source requise.");
      return;
    }

    const label = editingSourceName.trim() || inferSourceName(normalizedUrl);
    setSavingSourceId(sourceId);
    try {
      await updateNewsletterSource(sourceId, { name: label, url: normalizedUrl });
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

  const deleteSource = async (src: NewsletterSource) => {
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

  const addContent = async () => {
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

  const generateDigest = async () => {
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
      const recentContext = visibleItems
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

      setNotice("Digest IA ajouté (visible dans le tableau de bord).");
      await loadFromServer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur serveur";
      setNotice(`Digest IA indisponible: ${msg}`);
    } finally {
      setAiBusy(false);
    }
  };

  return {
    sources,
    items,
    visibleItems,
    query,
    setQuery,
    sourceName,
    setSourceName,
    sourceUrl,
    setSourceUrl,
    editingSourceId,
    editingSourceName,
    setEditingSourceName,
    editingSourceUrl,
    setEditingSourceUrl,
    contentTitle,
    setContentTitle,
    contentSummary,
    setContentSummary,
    contentTopic,
    setContentTopic,
    contentLink,
    setContentLink,
    contentSourceId,
    setContentSourceId,
    loading,
    submitting,
    savingSourceId,
    deletingSourceId,
    aiBusy,
    notice,
    addSource,
    startEditSource,
    cancelEditSource,
    updateSource,
    deleteSource,
    addContent,
    generateDigest,
  };
}
