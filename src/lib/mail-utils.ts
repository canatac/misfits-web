// mail-utils.ts — pure utility functions for mail content processing.
// Extracted from components/mail/email-view-utils.ts (Boucle 14) to allow
// hooks/stores/lib to consume it without violating the layer boundary.

export function toPlainText(body: string, bodyType: "html" | "text"): string {
  if (bodyType === "text") return body;
  return body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
