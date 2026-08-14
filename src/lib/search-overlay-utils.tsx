import type { MatchHighlight } from "@/types/search";

/**
 * Utility helpers for search-overlay.
 * Extracted Sprint 10.
 */

export function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "short" });
  if (date.getFullYear() === now.getFullYear())
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: MatchHighlight[];
}) {
  if (highlights.length === 0) return <>{text}</>;
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const nonOverlapping: MatchHighlight[] = [];
  let lastEnd = -1;
  for (const h of sorted) {
    if (h.start >= lastEnd) {
      nonOverlapping.push(h);
      lastEnd = h.end;
    }
  }
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (let i = 0; i < nonOverlapping.length; i++) {
    const h = nonOverlapping[i];
    if (h.start > pos) parts.push(text.slice(pos, h.start));
    parts.push(
      <mark
        key={i}
        className="rounded-[var(--radius-sm)] bg-[var(--color-brand-500)]/20 px-0.5 font-semibold text-[var(--color-fg)]"
      >
        {text.slice(h.start, h.end)}
      </mark>
    );
    pos = h.end;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

export function fieldHighlights(
  highlights: MatchHighlight[],
  field: MatchHighlight["field"]
): MatchHighlight[] {
  return highlights.filter((h) => h.field === field);
}

