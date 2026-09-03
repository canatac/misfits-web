import type { ChatMessage } from "@/types/ai";
import type { NewsletterItem } from "@/types/newsletters";
import type { DashboardSuggestedNews, DashboardSuggestedNewsItem } from "@/app/dashboard/types";

const ALLOWED_CATEGORIES = new Set([
  "defaillance",
  "capital",
  "bourse",
  "emploi",
  "scandale",
] as const);

const CRITERIA = [
  "défaillance / incident majeur",
  "nouvel apport de capital / levée de fonds",
  "mouvement en bourse / variation marquée",
  "annonces d'emploi ou plans de recrutement",
  "scandales, enquêtes, sanctions, contentieux",
];

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function asIsoDate(value: string): string {
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return "";
  return new Date(ts).toISOString();
}

function normalizeItems(value: unknown): DashboardSuggestedNewsItem[] {
  if (!Array.isArray(value)) return [];
  const out: DashboardSuggestedNewsItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    const url = typeof obj.url === "string" ? obj.url.trim() : "";
    const reason = typeof obj.reason === "string" ? obj.reason.trim() : "";
    const source = typeof obj.source === "string" ? obj.source.trim() : "";
    const categoryRaw =
      typeof obj.category === "string" ? obj.category.trim().toLowerCase() : "";
    const publishedAtRaw =
      typeof obj.publishedAt === "string" ? obj.publishedAt.trim() : "";
    const publishedAt = asIsoDate(publishedAtRaw);

    if (
      !title ||
      !url ||
      !/^https?:\/\//i.test(url) ||
      !reason ||
      !source ||
      !publishedAt ||
      !ALLOWED_CATEGORIES.has(categoryRaw as never)
    ) {
      continue;
    }

    out.push({
      title,
      url,
      reason,
      source,
      publishedAt,
      category: categoryRaw as DashboardSuggestedNewsItem["category"],
    });

    if (out.length >= 5) break;
  }

  return out;
}

function buildPrompt(summaryText: string, newsletters: NewsletterItem[], locale: "fr" | "en"): ChatMessage[] {
  const compact = newsletters.slice(0, 10).map((item) => ({
    id: item.id,
    title: item.title,
    topic: item.topic,
    signal: item.signal,
    updatedAt: item.updatedAt,
    links: item.links.slice(0, 3),
    summary: item.summary.slice(0, 450),
  }));

  const instruction =
    locale === "fr"
      ? "Tu es un analyste veille marché/risque. Tu dois chercher des actualités web pertinentes à partager au dirigeant, en te basant sur le résumé métier du jour et les critères demandés."
      : "You are a market/risk intelligence analyst. Search the web for relevant news to share with the founder based on today's business brief and required criteria.";

  return [
    {
      role: "system",
      content: `${instruction} Réponds strictement en JSON valide sans markdown.`,
    },
    {
      role: "user",
      content: [
        locale === "fr"
          ? "Utilise une recherche web actuelle puis retourne au plus 5 actualités prioritaires."
          : "Use current web search then return up to 5 priority news items.",
        locale === "fr"
          ? "Chaque actualité DOIT inclure une date de publication et un nom de source média."
          : "Each news item MUST include publication date and media source name.",
        locale === "fr" ? "Format JSON strict:" : "Strict JSON format:",
        '{"items":[{"title":"...","url":"https://...","reason":"...","source":"Reuters","publishedAt":"2026-09-03T08:30:00Z","category":"defaillance|capital|bourse|emploi|scandale"}]}',
        locale === "fr" ? "Critères obligatoires:" : "Mandatory criteria:",
        ...CRITERIA.map((v) => `- ${v}`),
        locale === "fr" ? "Résumé métier du jour:" : "Daily business brief:",
        summaryText,
        locale === "fr" ? "Contexte newsletters (JSON):" : "Newsletter context (JSON):",
        JSON.stringify(compact),
      ].join("\n"),
    },
  ];
}

export async function suggestNewsFromDailyBrief(args: {
  summaryText: string;
  newsletters: NewsletterItem[];
  locale?: "fr" | "en";
}): Promise<DashboardSuggestedNews> {
  const locale = args.locale ?? "fr";
  if (!args.summaryText.trim() || args.newsletters.length === 0) {
    return { items: [], generatedAt: new Date().toISOString(), source: "none" };
  }

  try {
    const response = await fetch("/api/hermes/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: buildPrompt(args.summaryText, args.newsletters, locale),
        sessionId: "dashboard-veille-news-opportunities",
        sessionKey: "misfits-dashboard-veille-news-opportunities",
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return { items: [], generatedAt: new Date().toISOString(), source: "none" };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const raw =
      (data?.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ??
      (typeof data?.content === "string" ? data.content : "");

    const payload = extractJsonObject(raw);
    if (!payload) return { items: [], generatedAt: new Date().toISOString(), source: "none" };

    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return {
      items: normalizeItems(parsed.items),
      generatedAt: new Date().toISOString(),
      source: "ai",
    };
  } catch {
    return { items: [], generatedAt: new Date().toISOString(), source: "none" };
  }
}
