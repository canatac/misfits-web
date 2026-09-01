// mail-utils.ts — pure utility functions for mail content processing.
// Extracted from components/mail/email-view-utils.ts (Boucle 14) to allow
// hooks/stores/lib to consume it without violating the layer boundary.

export function toPlainText(body: string, bodyType: "html" | "text"): string {
  if (bodyType === "text") return body;
  // Iteratively strip <style> blocks to handle nested/malformed tags that
  // a single-pass replacement may miss.
  let result = body;
  let prev: string;
  do {
    prev = result;
    result = result.replace(/<style[^>]*>[\s\S]*?<\/style\s*>/gi, "");
  } while (result !== prev);
  return result
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
