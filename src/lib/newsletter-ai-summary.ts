/**
 * newsletter-ai-summary.ts — AI-powered newsletter summary generation utilities.
 */
import type { NewsletterItem } from "@/types/newsletters";
import { stripHtml } from "@/lib/ai-prompt-builders";

export type NewsletterAISummaryInput = {
  items: NewsletterItem[];
  locale?: "fr" | "en";
};

export type NewsletterAISummary = {
  prompt: string;
  maxTokens: number;
};

const EN_INSTRUCTIONS =
  "You are an AI newsletter summarizer for misfits.ai Mail. " +
  "Produce a concise, actionable digest in HTML (p, br, ul, li, strong only). " +
  "Highlight the top 3 items by signal, then list remaining high-signal items.";

const FR_INSTRUCTIONS =
  "Tu es un synthétiseur de newsletters pour misfits.ai Mail. " +
  "Produis un résumé concis et actionnable en HTML (p, br, ul, li, strong uniquement). " +
  "Mets en avant les 3 articles les plus importants par signal, puis liste les autres à fort signal.";

function buildItemBlock(item: NewsletterItem): string {
  const title = stripHtml(item.title || "");
  const summary = stripHtml(item.summary || "");
  return [
    `- [${item.signal ?? 0}] ${title}`,
    summary ? `  ${summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildNewsletterAISummaryInput(
  input: NewsletterAISummaryInput
): NewsletterAISummary {
  const items = Array.isArray(input.items) ? input.items : [];
  const locale = input.locale ?? "fr";
  const instructions = locale === "fr" ? FR_INSTRUCTIONS : EN_INSTRUCTIONS;

  const topItems = items
    .slice()
    .sort((a, b) => Number(b.signal || 0) - Number(a.signal || 0))
    .slice(0, 3);

  const remainingHigh = items.filter(
    (it) => !topItems.includes(it) && Number(it.signal || 0) >= 80
  );

  const userParts: string[] = [
    `Locale: ${locale}`,
    `Total newsletters: ${items.length}`,
    "",
    "## Top 3 by signal",
    topItems.map(buildItemBlock).join("\n"),
  ];

  if (remainingHigh.length > 0) {
    userParts.push("", "## Other high-signal (≥80)", remainingHigh.map(buildItemBlock).join("\n"));
  }

  return {
    prompt: `${instructions}\n\n${userParts.join("\n")}`,
    maxTokens: 1024,
  };
}

export function shouldTriggerAISummary(items: NewsletterItem[]): boolean {
  if (!Array.isArray(items)) return false;
  return items.filter((it) => Number(it.signal || 0) >= 70).length >= 3;
}
