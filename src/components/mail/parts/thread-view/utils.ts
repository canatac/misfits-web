import DOMPurify from "dompurify";
import type { Email } from "@/types/email";

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function sanitizeBody(email: Email): string {
  if (email.bodyType === "text") {
    const escaped = email.body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/\n/g, "<br>");
  }
  return DOMPurify.sanitize(email.body, {
    ALLOWED_TAGS: [
      "p", "br", "div", "span", "a", "img",
      "ul", "ol", "li",
      "b", "strong", "i", "em", "u", "s", "del",
      "blockquote", "pre", "code",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr", "sub", "sup",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "style", "class", "id", "target",
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

export function getPreview(email: Email): string {
  const rawText =
    email.preview ||
    DOMPurify.sanitize(email.body, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
  const lines = rawText.split("\n").filter(Boolean);
  return lines.slice(0, 2).join(" — ").slice(0, 200);
}
