"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsletterItem, NewsletterSource } from "@/types/newsletters";

export function SummaryList({
  items,
  sources,
}: {
  items: NewsletterItem[];
  sources: NewsletterSource[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const source = sources.find((s) => s.id === item.sourceId);
        return (
          <article key={item.id} className="rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-semibold text-white">{item.title}</h2>
              <Badge variant="secondary">{item.topic}</Badge>
              <Badge className="ml-auto bg-[#1E1A15] text-[#F2D5A7]">Signal {item.signal}%</Badge>
            </div>
            <p className="mb-2 text-xs text-[#A1A1AA]">Source: {source?.name ?? "N/A"}</p>
            <p className="text-sm whitespace-pre-wrap text-[#C4C4CC]">{item.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.links.map((link) => (
                <a
                  key={`${item.id}-${link.name}-${link.url}`}
                  href={link.url}
                  className="inline-flex items-center gap-1 text-xs text-[#E9C995] hover:underline"
                >
                  {link.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
