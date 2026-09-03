"use client";

import type { ReactNode } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsletterLink } from "@/types/newsletters";
import type { DashboardNewsletterItem } from "../types";

type DigestBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const digestDateFormatter = new Intl.DateTimeFormat("fr-FR", {
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
  return { name: label || "Source", url };
}

function uniqueLinks(links: NewsletterLink[]): NewsletterLink[] {
  const seen = new Map<string, NewsletterLink>();
  for (const link of links) {
    const url = sanitizeUrl(link.url);
    if (!url || seen.has(url)) continue;
    seen.set(url, { name: link.name?.trim() || "Source", url });
  }
  return Array.from(seen.values());
}

function parseNewsletterSummary(
  summary: string,
  links: NewsletterLink[]
): { blocks: DigestBlock[]; sources: NewsletterLink[] } {
  const lines = summary.replace(/\r\n/g, "\n").split("\n");
  const blocks: DigestBlock[] = [];
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
      const parsedSource = parseSourceLine(line);
      if (parsedSource) extractedSources.push(parsedSource);
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
      if (!listOrdered) {
        flushList();
        listOrdered = true;
      }
      listBuffer.push(numberedMatch[1].trim());
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (listOrdered) {
        flushList();
        listOrdered = false;
      }
      listBuffer.push(bulletMatch[1].trim());
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: line });
  }

  flushList();

  return {
    blocks,
    sources: uniqueLinks([...(links ?? []), ...extractedSources]),
  };
}

function renderDigestBlock(block: DigestBlock, key: string): ReactNode {
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
      {block.items.map((value, idx) => (
        <li key={`${key}_${idx}`} className="leading-7 marker:text-[#BFA27A]">
          {value}
        </li>
      ))}
    </ListTag>
  );
}

function formatDigestDate(value?: string): string {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return digestDateFormatter.format(date);
}

export function NewsletterDetailContent({ item }: { item: DashboardNewsletterItem }) {
  const parsed = parseNewsletterSummary(item.summary, item.links ?? []);
  const signalSafe = Math.min(100, Math.max(0, Math.round(item.signal)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge
          variant="secondary"
          className="border border-[#2C2C32] bg-[#1A1A1F] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#D4D4D8]"
        >
          {item.topic ?? item.tags[0] ?? "Newsletter"}
        </Badge>
        <Badge className="border border-[#3A3126] bg-[#1B1712] px-2.5 py-1 text-[11px] font-semibold text-[#F2D5A7]">
          Signal {signalSafe}%
        </Badge>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#25252A] bg-[#151519] px-2.5 py-1 text-[11px] text-[#9F9FA8]">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDigestDate(item.updatedAt ?? item.createdAt)}
        </span>
      </div>

      <h2 className="text-lg font-semibold tracking-tight text-white">{item.title}</h2>

      <div className="space-y-3.5 rounded-xl border border-[#232329] bg-[#121217]/70 p-4 lg:p-5">
        {parsed.blocks.map((block, idx) => renderDigestBlock(block, `newsletter_${item.id}_${idx}`))}
      </div>

      {parsed.sources.length > 0 && (
        <div className="border-t border-[#232327] pt-4">
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
    </div>
  );
}
