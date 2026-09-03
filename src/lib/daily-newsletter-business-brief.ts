import type { ChatMessage } from "@/types/ai";
import type { DashboardBusinessBrief } from "@/app/dashboard/types";
import type { NewsletterItem } from "@/types/newsletters";

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function cleanText(raw: string): string {
  return raw
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(value: string): string {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const split = cleaned.split(/(?<=[.!?])\s+/);
  return (split[0] ?? cleaned).trim();
}

function fallbackBusinessBrief(newsletters: NewsletterItem[], locale: "fr" | "en"): string {
  const top = newsletters
    .slice()
    .sort((a, b) => Number(b.signal || 0) - Number(a.signal || 0))
    .slice(0, 2);

  if (top.length === 0) {
    return locale === "fr"
      ? "Aucun signal métier prioritaire détecté aujourd’hui sur la veille."
      : "No priority business signal detected in today's watch.";
  }

  if (locale === "fr") {
    const [a, b] = top;
    if (!b) {
      return `${a.title}: ${firstSentence(a.summary) || "point prioritaire à traiter."}`;
    }
    return `${a.title}: ${firstSentence(a.summary)} Ensuite, ${b.title}: ${firstSentence(b.summary)}`;
  }

  const [a, b] = top;
  if (!b) {
    return `${a.title}: ${firstSentence(a.summary) || "priority item to review."}`;
  }
  return `${a.title}: ${firstSentence(a.summary)} Next, ${b.title}: ${firstSentence(b.summary)}`;
}

function buildPrompt(newsletters: NewsletterItem[], locale: "fr" | "en"): ChatMessage[] {
  const compact = newsletters.slice(0, 12).map((item) => ({
    title: item.title,
    topic: item.topic,
    signal: item.signal,
    updatedAt: item.updatedAt,
    links: item.links.slice(0, 3),
    summary: item.summary.slice(0, 550),
  }));

  return [
    {
      role: "system",
      content:
        locale === "fr"
          ? "Tu es analyste business pour un dirigeant. Rédige un rapport métier bref, actionnable, sans statistiques de volume."
          : "You are a business analyst for a founder. Write a short actionable business brief, without volume statistics.",
    },
    {
      role: "user",
      content:
        locale === "fr"
          ? [
              "Retourne strictement du JSON valide sans markdown:",
              '{"brief":"..."}',
              "Contraintes:",
              "- Français.",
              "- 2 phrases max.",
              "- Focus métier: risques, opportunités, impacts business, décisions potentielles.",
              "- Interdit: formules de type 'X synthèses', 'Y nouvelles', ou KPI de volume.",
              "- Mentionner des sujets concrets issus de la veille.",
              "Contexte veille (JSON):",
              JSON.stringify(compact),
            ].join("\n")
          : [
              "Return strict JSON only:",
              '{"brief":"..."}',
              "Constraints: 2 sentences max, business focus (risk/opportunity/impact/decision), no volume metrics.",
              "Watch context (JSON):",
              JSON.stringify(compact),
            ].join("\n"),
    },
  ];
}

export async function generateDailyNewsletterBusinessBrief(args: {
  newsletters: NewsletterItem[];
  locale?: "fr" | "en";
}): Promise<DashboardBusinessBrief> {
  const locale = args.locale ?? "fr";
  if (!args.newsletters.length) {
    return {
      text:
        locale === "fr"
          ? "Aucun signal métier prioritaire détecté aujourd’hui sur la veille."
          : "No priority business signal detected in today's watch.",
      generatedAt: new Date().toISOString(),
      source: "rules",
    };
  }

  try {
    const response = await fetch("/api/hermes/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: buildPrompt(args.newsletters, locale),
        sessionId: "dashboard-business-brief",
        sessionKey: "misfits-dashboard-business-brief",
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return {
        text: fallbackBusinessBrief(args.newsletters, locale),
        generatedAt: new Date().toISOString(),
        source: "rules",
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const raw =
      (data?.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ??
      (typeof data?.content === "string" ? data.content : "");

    const payload = extractJsonObject(raw);
    if (!payload) {
      return {
        text: fallbackBusinessBrief(args.newsletters, locale),
        generatedAt: new Date().toISOString(),
        source: "rules",
      };
    }

    const parsed = JSON.parse(payload) as Record<string, unknown>;
    const brief = typeof parsed.brief === "string" ? cleanText(parsed.brief) : "";

    if (!brief) {
      return {
        text: fallbackBusinessBrief(args.newsletters, locale),
        generatedAt: new Date().toISOString(),
        source: "rules",
      };
    }

    return { text: brief, generatedAt: new Date().toISOString(), source: "ai" };
  } catch {
    return {
      text: fallbackBusinessBrief(args.newsletters, locale),
      generatedAt: new Date().toISOString(),
      source: "rules",
    };
  }
}
