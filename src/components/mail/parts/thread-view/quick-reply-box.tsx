"use client";

import { useState, useCallback } from "react";
import { Reply, Forward, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/mail/tiptap-editor";
import type { Thread } from "@/types/thread";

interface QuickReplyProps {
  thread: Thread;
  onReply: (thread: Thread) => void;
  onForward: (thread: Thread) => void;
}

export function QuickReplyBox({ thread, onReply, onForward }: QuickReplyProps) {
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
          expanded ? "p-3" : "p-2"
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
