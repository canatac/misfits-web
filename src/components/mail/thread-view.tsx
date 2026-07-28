"use client";

/**
 * Thread view — chronological display of all messages in a conversation.
 *
 * Features:
 *  - List or timeline view (toggle)
 *  - Collapse/expand individual messages (2-line preview when collapsed)
 *  - Highlight latest unread message
 *  - DOMPurify-sanitized HTML body rendering
 *  - Inline quick-reply box (Tiptap)
 *  - Forward entire thread as a single email
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import DOMPurify from "dompurify";
import {
  ChevronDown,
  ChevronUp,
  Reply,
  Forward,
  Send,
  PanelTop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { TiptapEditor } from "@/components/mail/tiptap-editor";
import type { Thread } from "@/types/thread";
import type { Email } from "@/types/email";
import { useThreadActions } from "@/hooks/use-threads";

/* ------------------------------------------------------------------ */

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Sanitize email body HTML with DOMPurify. */
function sanitizeBody(email: Email): string {
  if (email.bodyType === "text") {
    const escaped = email.body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/\n/g, "<br>");
  }
  return DOMPurify.sanitize(email.body, {
    ALLOWED_TAGS: [
      "p", "br", "div", "span", "a", "img", "ul", "ol", "li",
      "b", "strong", "i", "em", "u", "s", "del", "blockquote",
      "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6",
      "table", "thead", "tbody", "tr", "th", "td", "hr", "sub", "sup",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "style", "class", "id",
      "target", "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/** Extract first ~2 lines of text from an email body for collapsed preview. */
function getPreview(email: Email): string {
  const text = email.preview || email.body.replace(/<[^>]*>/g, "");
  const lines = text.split("\n").filter(Boolean);
  return lines.slice(0, 2).join(" — ").slice(0, 200);
}

/* ------------------------------------------------------------------ */
/* Single message component                                           */
/* ------------------------------------------------------------------ */

interface MessageProps {
  email: Email;
  isHighlighted: boolean;
  viewMode: "list" | "timeline";
  defaultCollapsed: boolean;
}

function ThreadMessageItem({
  email,
  isHighlighted,
  viewMode,
  defaultCollapsed,
}: MessageProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loadImages, setLoadImages] = useState(false);

  const sanitized = useMemo(
    () => sanitizeBody(email),
    [email],
  );

  // Reset collapse state when email changes
  useEffect(() => {
    setCollapsed(defaultCollapsed);
    setLoadImages(false);
  }, [email.id, defaultCollapsed]);

  const isTimeline = viewMode === "timeline";

  return (
    <div
      className={cn(
        "relative",
        isTimeline && "flex gap-3 pl-2",
      )}
      data-testid={`thread-message-${email.id}`}
    >
      {/* Timeline line */}
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
          !isHighlighted && isTimeline && "pb-4",
        )}
      >
        {/* Message header */}
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
                      : "text-[var(--color-fg)]",
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

        {/* Message body */}
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

/* ------------------------------------------------------------------ */
/* Quick reply box                                                    */
/* ------------------------------------------------------------------ */

interface QuickReplyProps {
  thread: Thread;
  onReply: (thread: Thread) => void;
  onForward: (thread: Thread) => void;
}

function QuickReplyBox({ thread, onReply, onForward }: QuickReplyProps) {
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSend = useCallback(() => {
    if (!body.trim()) return;
    onReply(thread);
    setBody("");
    setExpanded(false);
  }, [body, thread, onReply]);

  return (
    <div className="border-t border-[var(--color-border)] p-3">
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] transition-all",
          expanded ? "p-3" : "p-2",
        )}
      >
        {expanded ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-muted-fg)]">
                Reply to thread
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
              >
                Cancel
              </button>
            </div>
            <TiptapEditor
              value={body}
              onChange={setBody}
              placeholder="Write your reply..."
              className="min-h-[80px]"
            />
            <div className="mt-2 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => onForward(thread)}>
                <Forward className="mr-1.5 h-3.5 w-3.5" />
                Forward thread
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onReply(thread)}>
                  <Reply className="mr-1.5 h-3.5 w-3.5" />
                  Open full composer
                </Button>
                <Button size="sm" onClick={handleSend} disabled={!body.trim()}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="flex w-full items-center gap-2 text-left text-sm text-[var(--color-muted-fg)]"
          >
            <Reply className="h-4 w-4" />
            <span>Reply to thread...</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main thread view                                                   */
/* ------------------------------------------------------------------ */

interface ThreadViewProps {
  thread: Thread | null;
  viewMode: "list" | "timeline";
  className?: string;
}

export function ThreadView({ thread, viewMode, className }: ThreadViewProps) {
  const { forwardThread, replyToThread } = useThreadActions();

  // Find the latest unread message for highlighting
  const latestUnread = useMemo(() => {
    if (!thread) return null;
    for (let i = thread.messages.length - 1; i >= 0; i--) {
      if (!thread.messages[i].isRead) return thread.messages[i];
    }
    return null;
  }, [thread]);

  if (!thread) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-[var(--color-bg)]",
          className,
        )}
        data-testid="thread-view-empty"
      >
        <EmptyState
          icon={PanelTop}
          title="No thread selected"
          description="Select a thread from the list to view its messages here."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[var(--color-bg)]",
        className,
      )}
      data-testid="thread-view"
    >
      {/* Action toolbar */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => replyToThread(thread)}
          className="gap-1.5"
        >
          <Reply className="h-4 w-4" />
          Reply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => forwardThread(thread)}
          className="gap-1.5"
        >
          <Forward className="h-4 w-4" />
          Forward thread
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-4">
          <div className="flex flex-col gap-4">
            {thread.messages.map((email, idx) => (
              <div key={email.id}>
                {idx > 0 && <Separator className="mb-4" />}
                <ThreadMessageItem
                  email={email}
                  isHighlighted={
                    latestUnread?.id === email.id && !email.isRead
                  }
                  viewMode={viewMode}
                  defaultCollapsed={
                    idx < thread.messages.length - 1 &&
                    email.isRead
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Quick reply */}
      <QuickReplyBox
        thread={thread}
        onReply={replyToThread}
        onForward={forwardThread}
      />
    </div>
  );
}
