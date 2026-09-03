import type { NewsletterItem } from "@/types/newsletters";

const GMT_PLUS_ONE_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DailyNewsletterSummary = {
  text: string;
  generatedAt: string;
  windowStartIso: string;
  nextRefreshIso: string;
};

function parseDate(value?: string): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function at0600GmtPlusOneWindow(now: Date): { start: number; next: number } {
  const utcNow = now.getTime();
  const shifted = utcNow + GMT_PLUS_ONE_OFFSET_MS;
  const shiftedDate = new Date(shifted);

  let startShifted = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    shiftedDate.getUTCDate(),
    6,
    0,
    0,
    0
  );

  if (shifted < startShifted) startShifted -= DAY_MS;

  const start = startShifted - GMT_PLUS_ONE_OFFSET_MS;
  return { start, next: start + DAY_MS };
}

function topTopic(items: NewsletterItem[]): string | null {
  const counts = new Map<string, number>();
  for (const item of items) {
    const topic = String(item.topic || "").trim();
    if (!topic) continue;
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestScore = -1;
  for (const [topic, count] of counts) {
    if (count > bestScore) {
      best = topic;
      bestScore = count;
    }
  }
  return best;
}

function latestUpdatedAt(items: NewsletterItem[]): number | null {
  let latest: number | null = null;
  for (const item of items) {
    const ts = parseDate(item.updatedAt) ?? parseDate(item.createdAt);
    if (ts === null) continue;
    if (latest === null || ts > latest) latest = ts;
  }
  return latest;
}

export function summarizeDailyNewsletters(
  items: NewsletterItem[],
  now = new Date(),
  locale: "fr" | "en" = "fr"
): DailyNewsletterSummary {
  const window = at0600GmtPlusOneWindow(now);
  const safeItems = Array.isArray(items) ? items : [];

  const newSinceWindow = safeItems.filter((item) => {
    const ts = parseDate(item.updatedAt) ?? parseDate(item.createdAt);
    return ts !== null && ts >= window.start;
  }).length;

  const highSignal = safeItems.filter((item) => Number(item.signal) >= 80).length;
  const top = safeItems
    .slice()
    .sort((a, b) => Number(b.signal || 0) - Number(a.signal || 0))[0];
  const dominantTopic = topTopic(safeItems);
  const latestTs = latestUpdatedAt(safeItems);
  const latestTime = latestTs
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(latestTs))
    : null;

  const text =
    locale === "fr"
      ? safeItems.length === 0
        ? "Veille & presse: aucun résumé disponible pour le moment. Prochaine consolidation à 06:00 (GMT+1)."
        : [
            `Veille & presse: ${safeItems.length} synthèse(s), ${newSinceWindow} nouvelle(s) depuis 06:00 GMT+1.`,
            `${highSignal} à fort signal (≥80).`,
            dominantTopic ? `Thème dominant: ${dominantTopic}.` : "",
            top ? `Point prioritaire: ${top.title}.` : "",
            latestTime ? `Dernière mise à jour ${latestTime}.` : "",
          ]
            .filter(Boolean)
            .join(" ")
      : safeItems.length === 0
        ? "Press watch: no digest available yet. Next consolidation at 06:00 (GMT+1)."
        : [
            `Press watch: ${safeItems.length} digest(s), ${newSinceWindow} new since 06:00 GMT+1.`,
            `${highSignal} high-signal (≥80).`,
            dominantTopic ? `Leading topic: ${dominantTopic}.` : "",
            top ? `Top item: ${top.title}.` : "",
            latestTime ? `Last update ${latestTime}.` : "",
          ]
            .filter(Boolean)
            .join(" ");

  return {
    text,
    generatedAt: now.toISOString(),
    windowStartIso: new Date(window.start).toISOString(),
    nextRefreshIso: new Date(window.next).toISOString(),
  };
}

export function getNext0600GmtPlusOneRefresh(now = new Date()): Date {
  return new Date(at0600GmtPlusOneWindow(now).next);
}
