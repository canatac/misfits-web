import { summarizeNewsletterSource } from "@/lib/newsletters-api";
import type { NewsletterSource, NewsletterTopic } from "@/types/newsletters";

type Setter<T> = (value: T) => void;

export async function generateDigestAction(args: {
  sources: NewsletterSource[];
  contentSourceId: string;
  contentTopic: NewsletterTopic;
  setAiBusy: Setter<boolean>;
  setNotice: Setter<string | null>;
  reload: () => Promise<void>;
}) {
  if (args.sources.length === 0) {
    args.setNotice("Ajoute au moins une source URL avant de générer un digest.");
    return;
  }

  const selectedSource =
    args.sources.find((src) => src.id === args.contentSourceId) ??
    args.sources.find((src) => Boolean(src.url));

  if (!selectedSource?.id) {
    args.setNotice("Aucune source disponible pour générer un digest.");
    return;
  }

  if (!selectedSource.url) {
    args.setNotice("La source sélectionnée n’a pas d’URL. Ajoute une URL puis relance.");
    return;
  }

  args.setAiBusy(true);
  try {
    const result = await summarizeNewsletterSource(selectedSource.id, {
      topic: args.contentTopic,
    });

    args.setNotice(
      `Digest généré depuis ${result.source.url} (${result.fetchedChars} caractères analysés).`
    );
    await args.reload();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    args.setNotice(`Digest IA indisponible: ${msg}`);
  } finally {
    args.setAiBusy(false);
  }
}
