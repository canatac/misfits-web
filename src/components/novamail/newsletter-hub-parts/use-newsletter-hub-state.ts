"use client";

import { useEffect, useMemo, useState } from "react";
import { listNewsletterItems, listNewsletterSources } from "@/lib/newsletters-api";
import type { NewsletterItem, NewsletterSource, NewsletterTopic } from "@/types/newsletters";
import {
  addContentAction,
  addSourceAction,
  deleteSourceAction,
  updateSourceAction,
} from "./newsletter-hub-actions";
import { generateDigestAction } from "./newsletter-hub-digest-action";

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
      if (!contentSourceId && serverSources[0]?.id) setContentSourceId(serverSources[0].id);
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

  const cancelEditSource = () => {
    setEditingSourceId(null);
    setEditingSourceName("");
    setEditingSourceUrl("");
  };

  const startEditSource = (src: NewsletterSource) => {
    setEditingSourceId(src.id);
    setEditingSourceName(src.name);
    setEditingSourceUrl(src.url ?? "");
    setNotice(null);
  };

  const addSource = () =>
    addSourceAction({
      sourceName,
      sourceUrl,
      setSubmitting,
      setSourceName,
      setSourceUrl,
      setContentSourceId,
      setNotice,
      reload: loadFromServer,
    });

  const updateSource = (sourceId: string) =>
    updateSourceAction({
      sourceId,
      editingSourceName,
      editingSourceUrl,
      setSavingSourceId,
      setNotice,
      cancelEditSource,
      reload: loadFromServer,
    });

  const deleteSource = (source: NewsletterSource) =>
    deleteSourceAction({
      source,
      sources,
      contentSourceId,
      editingSourceId,
      setDeletingSourceId,
      setContentSourceId,
      cancelEditSource,
      setNotice,
      reload: loadFromServer,
    });

  const addContent = () =>
    addContentAction({
      contentSourceId,
      contentTitle,
      contentSummary,
      contentTopic,
      contentLink,
      setSubmitting,
      setContentTitle,
      setContentSummary,
      setContentLink,
      setNotice,
      reload: loadFromServer,
    });

  const generateDigest = () =>
    generateDigestAction({
      sources,
      visibleItems,
      contentSourceId,
      setAiBusy,
      setNotice,
      reload: loadFromServer,
    });

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
