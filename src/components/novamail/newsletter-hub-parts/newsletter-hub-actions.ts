import {
  createNewsletterItem,
  createNewsletterSource,
  deleteNewsletterSource,
  updateNewsletterSource,
} from "@/lib/newsletters-api";
import { emitNewsletterUpdated } from "@/lib/newsletter-events";
import type {
  NewsletterSource,
  NewsletterSubscriptionSuggestion,
  NewsletterTopic,
} from "@/types/newsletters";
import { inferSourceName, normalizeHttpUrl } from "./newsletter-hub-utils";

type Setter<T> = (value: T) => void;

export async function addSourceAction(args: {
  sourceName: string;
  sourceUrl: string;
  setSubmitting: Setter<boolean>;
  setSourceName: Setter<string>;
  setSourceUrl: Setter<string>;
  setContentSourceId: Setter<string>;
  setNotice: Setter<string | null>;
  reload: () => Promise<void>;
}) {
  const normalizedUrl = normalizeHttpUrl(args.sourceUrl);
  if (!normalizedUrl) return args.setNotice("URL source requise.");

  const label = args.sourceName.trim() || inferSourceName(normalizedUrl);
  args.setSubmitting(true);
  try {
    const created = await createNewsletterSource({ name: label, url: normalizedUrl });
    args.setSourceName("");
    args.setSourceUrl("");
    args.setContentSourceId(created.id);
    args.setNotice(`Source ajoutée: ${created.name}`);
    await args.reload();
    emitNewsletterUpdated();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    args.setNotice(`Échec ajout source: ${msg}`);
  } finally {
    args.setSubmitting(false);
  }
}

export async function updateSourceAction(args: {
  sourceId: string;
  editingSourceName: string;
  editingSourceUrl: string;
  setSavingSourceId: Setter<string | null>;
  setNotice: Setter<string | null>;
  cancelEditSource: () => void;
  reload: () => Promise<void>;
}) {
  const normalizedUrl = normalizeHttpUrl(args.editingSourceUrl);
  if (!normalizedUrl) return args.setNotice("URL source requise.");

  const label = args.editingSourceName.trim() || inferSourceName(normalizedUrl);
  args.setSavingSourceId(args.sourceId);
  try {
    await updateNewsletterSource(args.sourceId, { name: label, url: normalizedUrl });
    args.setNotice("Source mise à jour.");
    args.cancelEditSource();
    await args.reload();
    emitNewsletterUpdated();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    args.setNotice(`Échec mise à jour source: ${msg}`);
  } finally {
    args.setSavingSourceId(null);
  }
}

export async function deleteSourceAction(args: {
  source: NewsletterSource;
  sources: NewsletterSource[];
  contentSourceId: string;
  editingSourceId: string | null;
  setDeletingSourceId: Setter<string | null>;
  setContentSourceId: Setter<string>;
  cancelEditSource: () => void;
  setNotice: Setter<string | null>;
  reload: () => Promise<void>;
}) {
  if (typeof window !== "undefined") {
    const ok = window.confirm(
      `Supprimer la source '${args.source.name}' ? Les résumés liés seront retirés.`
    );
    if (!ok) return;
  }

  args.setDeletingSourceId(args.source.id);
  try {
    await deleteNewsletterSource(args.source.id);
    if (args.contentSourceId === args.source.id) {
      const fallback = args.sources.find((s) => s.id !== args.source.id)?.id ?? "";
      args.setContentSourceId(fallback);
    }
    if (args.editingSourceId === args.source.id) args.cancelEditSource();
    args.setNotice(`Source supprimée: ${args.source.name}`);
    await args.reload();
    emitNewsletterUpdated();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    args.setNotice(`Échec suppression source: ${msg}`);
  } finally {
    args.setDeletingSourceId(null);
  }
}

export async function addContentAction(args: {
  contentSourceId: string;
  contentTitle: string;
  contentSummary: string;
  contentTopic: NewsletterTopic;
  contentLink: string;
  setSubmitting: Setter<boolean>;
  setContentTitle: Setter<string>;
  setContentSummary: Setter<string>;
  setContentLink: Setter<string>;
  setNotice: Setter<string | null>;
  reload: () => Promise<void>;
}) {
  const title = args.contentTitle.trim();
  const summary = args.contentSummary.trim();
  if (!args.contentSourceId) return args.setNotice("Ajoute d'abord une source URL.");
  if (!title || !summary) return args.setNotice("Titre et résumé requis.");

  args.setSubmitting(true);
  try {
    await createNewsletterItem({
      sourceId: args.contentSourceId,
      title,
      summary,
      topic: args.contentTopic,
      link: args.contentLink.trim() || undefined,
    });
    args.setContentTitle("");
    args.setContentSummary("");
    args.setContentLink("");
    args.setNotice(`Résumé ajouté: ${title}`);
    await args.reload();
    emitNewsletterUpdated();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    args.setNotice(`Échec ajout résumé: ${msg}`);
  } finally {
    args.setSubmitting(false);
  }
}

export async function addSuggestedSourceAction(args: {
  suggestion: NewsletterSubscriptionSuggestion;
  setSubmitting: Setter<boolean>;
  setContentSourceId: Setter<string>;
  setNotice: Setter<string | null>;
  reload: () => Promise<void>;
}) {
  args.setSubmitting(true);
  try {
    const created = await createNewsletterSource({
      name: args.suggestion.title.trim(),
      url: args.suggestion.url.trim(),
    });
    args.setContentSourceId(created.id);
    args.setNotice(`Source suggérée ajoutée: ${created.name}`);
    await args.reload();
    emitNewsletterUpdated();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    args.setNotice(`Échec ajout suggestion: ${msg}`);
  } finally {
    args.setSubmitting(false);
  }
}
