import type { NewsletterTopic } from "@/types/newsletters";

export const NEWSLETTER_TOPICS: NewsletterTopic[] = [
  "Tech",
  "Finance",
  "Lifestyle",
  "Science",
  "Design",
];

export function normalizeHttpUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

export function inferSourceName(rawUrl: string): string {
  const url = normalizeHttpUrl(rawUrl);
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || "Source";
  } catch {
    return "Source";
  }
}
