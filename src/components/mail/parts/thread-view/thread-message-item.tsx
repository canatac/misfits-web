"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Email } from "@/types/email";
import { formatFullDate, getInitials, sanitizeBody, getPreview } from "./utils";

interface MessageProps {
  email: Email;
  isHighlighted: boolean;
  viewMode: "list" | "timeline";
  defaultCollapsed: boolean;
}

export function ThreadMessageItem({
  email,
  isHighlighted,
  viewMode,
  defaultCollapsed,
}: MessageProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loadImages, setLoadImages] = useState(false);

  const sanitized = useMemo(() => sanitizeBody(email), [email]);

  useEffect(() => {
    setCollapsed(defaultCollapsed);
    setLoadImages(false);
  }, [email.id, defaultCollapsed]);

  const isTimeline = viewMode === "timeline";

  return (
    <div
      className={cn("relative", isTimeline && "flex gap-3 pl-2")}
      data-testid={`thread-message-${email.id}`}
    >
      {isTimeline && (
        <div className="flex flex-col items-center">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(email.from.name)}
            </AvatarFallback>
          </Avatar>
          <div className="mt-1 w-px flex-1 bg-[var(--color-border)]" />
        </div>
      )}

      <div
        className={cn(
          "flex-1",
          isHighlighted && "rounded-[var(--radius-md)] bg-[var(--color-accent)] p-3",
          !isHighlighted && isTimeline && "pb-4"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {!isTimeline && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(email.from.name)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    !email.isRead
                      ? "font-semibold text-[var(--color-fg)]"
                      : "text-[var(--color-fg)]"
                  )}
                >
                  {email.from.name}
                </span>
                <span className="text-xs text-[var(--color-muted-fg)]">
                  &lt;{email.from.address}&gt;
                </span>
              </div>
              <span className="text-xs text-[var(--color-muted-fg)]">
                {formatFullDate(email.date)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 transition-colors hover:bg-[var(--color-muted)]"
            aria-label={collapsed ? "Expand message" : "Collapse message"}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-[var(--color-muted-fg)]" />
            ) : (
              <ChevronUp className="h-4 w-4 text-[var(--color-muted-fg)]" />
            )}
          </button>
        </div>

        {collapsed ? (
          <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-fg)]">
            {getPreview(email)}
          </p>
        ) : (
          <>
            {!loadImages && email.bodyType === "html" && (
              <div className="mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1 text-xs text-[var(--color-muted-fg)]">
                Images blocked
                <button
                  onClick={() => setLoadImages(true)}
                  className="text-[var(--color-brand-500)] hover:underline"
                >
                  Load
                </button>
              </div>
            )}
            <div
              className="prose-mail mt-2 text-sm text-[var(--color-fg)]"
              // biome-ignore lint: HTML is sanitized via DOMPurify above
              dangerouslySetInnerHTML={{ __html: sanitized }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === "A") {
                  e.preventDefault();
                  const href = target.getAttribute("href");
                  if (href && href.startsWith("http")) {
                    window.open(href, "_blank", "noopener,noreferrer");
                  }
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
