import { createNewsletterItem } from "@/lib/newsletters-api";
import type { NewsletterItem, NewsletterSource } from "@/types/newsletters";

type Setter<T> = (value: T) => void;

export async function generateDigestAction(args: {
  sources: NewsletterSource[];
  visibleItems: NewsletterItem[];
  contentSourceId: string;
  setAiBusy: Setter<boolean>;
  setNotice: Setter<string | null>;
  reload: () => Promise<void>;
}) {
  if (args.sources.length === 0) {
    args.setNotice("Ajoute au moins une source URL avant de générer un digest.");
    return;
  }

  args.setAiBusy(true);
  try {
    const sourceContext = args.sources
      .slice(0, 12)
      .map((src) => `- ${src.name}: ${src.url ?? "URL non renseignée"}`)
      .join("\n");
    const recentContext = args.visibleItems
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

    const data = (await res.json().catch(() => ({}))) as { content?: string; error?: { message?: string } };
    const summary = data.content || data.error?.message || "Briefing indisponible (fallback local).";
    const selectedSourceId = args.contentSourceId || args.sources[0]?.id;
    if (!selectedSourceId) return args.setNotice("Aucune source disponible pour enregistrer le digest.");

    await createNewsletterItem({
      sourceId: selectedSourceId,
      title: "AI Executive Digest",
      summary,
      topic: "Tech",
      signal: 95,
    });

    args.setNotice("Digest IA ajouté (visible dans le tableau de bord).");
    await args.reload();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    args.setNotice(`Digest IA indisponible: ${msg}`);
  } finally {
    args.setAiBusy(false);
  }
}
