"use client";

import type { ReactNode } from "react";
import { CalendarDays, ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsletterItem, NewsletterLink, NewsletterSource } from "@/types/newsletters";

type SummaryBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

type SummaryViewModel = {
  blocks: SummaryBlock[];
  sources: NewsletterLink[];
};

const summaryDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parseSourceLine(line: string): NewsletterLink | null {
  const urlMatch = line.match(/https?:\/\/[^\s)]+/i);
  if (!urlMatch) return null;
  const url = sanitizeUrl(urlMatch[0]);
  if (!url) return null;
  const label = line
    .replace(/^[-*•]\s*/, "")
    .replace(urlMatch[0], "")
    .replace(/^[:\-\s]+|[:\-\s]+$/g, "")
    .trim();
  return {
    name: label || "Source",
    url,
  };
}

function uniqueLinks(links: NewsletterLink[]): NewsletterLink[] {
  const byUrl = new Map<string, NewsletterLink>();
  for (const link of links) {
    const url = sanitizeUrl(link.url);
    if (!url) continue;
    if (!byUrl.has(url)) {
      byUrl.set(url, {
        name: link.name?.trim() || "Source",
        url,
      });
    }
  }
  return Array.from(byUrl.values());
}

function parseSummary(summary: string, links: NewsletterLink[]): SummaryViewModel {
  const lines = summary.replace(/\r\n/g, "\n").split("\n");
  const blocks: SummaryBlock[] = [];
  const extractedSources: NewsletterLink[] = [];

  let inSourcesSection = false;
  let listBuffer: string[] = [];
  let listOrdered = false;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push({ type: "list", ordered: listOrdered, items: listBuffer });
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (/^sources?\s*:?$/i.test(line)) {
      flushList();
      inSourcesSection = true;
      continue;
    }

    if (inSourcesSection) {
      const parsed = parseSourceLine(line);
      if (parsed) extractedSources.push(parsed);
      continue;
    }

    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flushList();
      blocks.push({ type: "heading", text: headingMatch[1].trim() });
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      const text = numberedMatch[1].trim();
      if (!listOrdered) {
        flushList();
        listOrdered = true;
      }
      listBuffer.push(text);
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      const text = bulletMatch[1].trim();
      if (listOrdered) {
        flushList();
        listOrdered = false;
      }
      listBuffer.push(text);
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: line });
  }

  flushList();

  return {
    blocks,
    sources: uniqueLinks([...links, ...extractedSources]),
  };
}

function formatSummaryDate(value?: string): string {
  if (!value) return "Date inconnue";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Date inconnue";
  return summaryDateFormatter.format(parsedDate);
}

function renderBlock(block: SummaryBlock, key: string): ReactNode {
  if (block.type === "heading") {
    return (
      <h3 key={key} className="mt-4 text-sm font-semibold tracking-wide text-[#F4F4F5] first:mt-0">
        {block.text}
      </h3>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p key={key} className="text-sm leading-7 text-[#D4D4D8]">
        {block.text}
      </p>
    );
  }

  const ListTag = block.ordered ? "ol" : "ul";
  return (
    <ListTag
      key={key}
      className={`space-y-1.5 pl-5 text-sm leading-7 text-[#D4D4D8] ${block.ordered ? "list-decimal" : "list-disc"}`}
    >
      {block.items.map((item, idx) => (
        <li key={`${key}_${idx}`} className="leading-7 marker:text-[#BFA27A]">
          {item}
        </li>
      ))}
    </ListTag>
  );
}

export function SummaryList({
  items,
  sources,
}: {
  items: NewsletterItem[];
  sources: NewsletterSource[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#242427] bg-[#101012]/80 p-6 text-center">
        <Newspaper className="mx-auto mb-2 h-5 w-5 text-[#71717A]" />
        <p className="text-sm text-[#A1A1AA]">Aucun résumé pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:gap-6">
      {items.map((item) => {
        const source = sources.find((s) => s.id === item.sourceId);
        const parsed = parseSummary(item.summary, item.links ?? []);
        const signalSafe = Math.min(100, Math.max(0, Math.round(item.signal)));
        const summaryDate = formatSummaryDate(item.updatedAt || item.createdAt);

        return (
          <article
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-[#2A2A2F] bg-[linear-gradient(165deg,#141419_0%,#0F0F13_60%,#0D0D11_100%)] p-5 shadow-[0_14px_38px_rgba(0,0,0,0.28)] transition-colors hover:border-[#3A3A42] lg:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <Badge
                variant="secondary"
                className="border border-[#2C2C32] bg-[#1A1A1F] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#D4D4D8]"
              >
                {item.topic}
              </Badge>
              <Badge className="border border-[#3A3126] bg-[#1B1712] px-2.5 py-1 text-[11px] font-semibold text-[#F2D5A7]">
                Signal {signalSafe}%
              </Badge>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#25252A] bg-[#151519] px-2.5 py-1 text-[11px] text-[#9F9FA8]">
                <CalendarDays className="h-3.5 w-3.5" />
                {summaryDate}
              </span>
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-white">{item.title}</h2>

            <p className="mt-1.5 text-xs text-[#9C9CA6]">
              Source principale: <span className="font-medium text-[#DADAE0]">{source?.name ?? "N/A"}</span>
            </p>

            <div className="mt-5 space-y-3.5 rounded-xl border border-[#232329] bg-[#121217]/70 p-4 lg:p-5">
              {parsed.blocks.map((block, idx) => renderBlock(block, `${item.id}_${idx}`))}
            </div>

            {parsed.sources.length > 0 && (
              <div className="mt-5 border-t border-[#232327] pt-4">
                <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#A1A1AA] uppercase">
                  Sources
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {parsed.sources.map((link) => (
                    <a
                      key={`${item.id}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#2F2F37] bg-[#17171D] px-3 py-1.5 text-xs text-[#F0CF9C] transition-colors hover:border-[#4A3E30] hover:bg-[#1C1A16] hover:text-[#F7DCB5]"
                    >
                      <span className="truncate">{link.name}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
