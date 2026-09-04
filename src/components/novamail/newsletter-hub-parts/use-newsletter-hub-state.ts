"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildNewsletterMonitoringSnapshot,
  getNewsletterMonitoringActivity,
  listNewsletterItems,
  listNewsletterSources,
  listNewsletterSuggestions,
} from "@/lib/newsletters-api";
import type {
  NewsletterItem,
  NewsletterMonitoringSnapshot,
  NewsletterSource,
  NewsletterSubscriptionSuggestion,
  NewsletterTopic,
} from "@/types/newsletters";
import {
  addContentAction,
  addSuggestedSourceAction,
  addSourceAction,
  deleteSourceAction,
  updateSourceAction,
} from "./newsletter-hub-actions";
import { generateDigestAction } from "./newsletter-hub-digest-action";

export function useNewsletterHubState() {
  const [sources, setSources] = useState<NewsletterSource[]>([]);
  const [items, setItems] = useState<NewsletterItem[]>([]);
  const [suggestions, setSuggestions] = useState<NewsletterSubscriptionSuggestion[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [monitoring, setMonitoring] = useState<NewsletterMonitoringSnapshot>({
    status: "idle",
    updatedAt: new Date().toISOString(),
    activeSources: 0,
    totalSummaries: 0,
    summaries24h: 0,
    runCount: 0,
    runningCount: 0,
    failedCount: 0,
    successRate: 0,
    totalTokens: 0,
    totalCostUsd: 0,
  });
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
      const [serverSources, serverItems, serverSuggestions] = await Promise.all([
        listNewsletterSources(),
        listNewsletterItems(),
        listNewsletterSuggestions(),
      ]);
      setSources(serverSources);
      setItems(serverItems);
      setSuggestions(serverSuggestions.suggestions);
      setInterests(serverSuggestions.interests);
      if (!contentSourceId && serverSources[0]?.id) setContentSourceId(serverSources[0].id);

      let activity = null;
      try {
        activity = await getNewsletterMonitoringActivity(80);
      } catch {
        activity = null;
      }

      setMonitoring(
        buildNewsletterMonitoringSnapshot({
          activeSources: serverSources.length,
          items: serverItems,
          aiBusy,
          activity,
        })
      );
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

  useEffect(() => {
    setMonitoring((prev) => ({
      ...prev,
      status: aiBusy ? "running" : prev.runningCount > 0 ? "running" : "idle",
      updatedAt: new Date().toISOString(),
    }));
  }, [aiBusy]);

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
      contentSourceId,
      contentTopic,
      setAiBusy,
      setNotice,
      reload: loadFromServer,
    });

  const addSuggestedSource = (suggestion: NewsletterSubscriptionSuggestion) =>
    addSuggestedSourceAction({
      suggestion,
      setSubmitting,
      setContentSourceId,
      setNotice,
      reload: loadFromServer,
    });

  return {
    sources,
    items,
    suggestions,
    interests,
    monitoring,
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
    addSuggestedSource,
  };
}
