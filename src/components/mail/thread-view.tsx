"use client";

/**
 * Thread view — chronological display of all messages in a conversation.
 */
import { useMemo } from "react";
import { Reply, Forward, PanelTop } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import type { Thread } from "@/types/thread";
import { useThreadActions } from "@/hooks/use-threads";
import { ThreadMessageItem } from "./parts/thread-view/thread-message-item";
import { QuickReplyBox } from "./parts/thread-view/quick-reply-box";

interface ThreadViewProps {
  thread: Thread | null;
  viewMode: "list" | "timeline";
  className?: string;
}

export function ThreadView({ thread, viewMode, className }: ThreadViewProps) {
  const { forwardThread, replyToThread } = useThreadActions();

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
          className
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
      className={cn("flex h-full flex-col bg-[var(--color-bg)]", className)}
      data-testid="thread-view"
    >
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => replyToThread(thread)} className="gap-1.5">
          <Reply className="h-4 w-4" />
          Reply
        </Button>
        <Button variant="ghost" size="sm" onClick={() => forwardThread(thread)} className="gap-1.5">
          <Forward className="h-4 w-4" />
          Forward thread
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-4">
          <div className="flex flex-col gap-4">
            {thread.messages.map((email, idx) => (
              <div key={email.id}>
                {idx > 0 && <Separator className="mb-4" />}
                <ThreadMessageItem
                  email={email}
                  isHighlighted={latestUnread?.id === email.id && !email.isRead}
                  viewMode={viewMode}
                  defaultCollapsed={
                    idx < thread.messages.length - 1 && email.isRead
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <QuickReplyBox thread={thread} onReply={replyToThread} onForward={forwardThread} />
    </div>
  );
}
