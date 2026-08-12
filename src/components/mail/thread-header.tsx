"use client";

/**
 * Thread header — subject, participant list, message count,
 * threading controls (mode toggle, enable/disable switch), and view toggle.
 */
import {
  MessagesSquare,
  Users,
  List as ListIcon,
  GitBranch,
  Sparkles,
  AtSign,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Thread } from "@/types/thread";
import type { ThreadingMode } from "@/types/thread";

interface ThreadHeaderProps {
  thread: Thread | null;
  threadingEnabled: boolean;
  threadingMode: ThreadingMode;
  viewMode: "list" | "timeline";
  onToggleThreading: () => void;
  onSetThreadingMode: (mode: ThreadingMode) => void;
  onSetViewMode: (mode: "list" | "timeline") => void;
}

function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MODE_ICONS: Record<ThreadingMode, typeof Sparkles> = {
  smart: Sparkles,
  byReferences: GitBranch,
  bySubject: ListIcon,
  byParticipants: AtSign,
};

export function ThreadHeader({
  thread,
  threadingEnabled,
  threadingMode,
  viewMode,
  onToggleThreading,
  onSetThreadingMode,
  onSetViewMode,
}: ThreadHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-4">
      {/* Threading controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-muted-fg)]">
            Threading
          </span>
          <Switch
            checked={threadingEnabled}
            onCheckedChange={onToggleThreading}
            aria-label="Toggle email threading"
          />
        </div>

        {threadingEnabled && (
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={threadingMode}
              onValueChange={(val) => {
                if (val) onSetThreadingMode(val as ThreadingMode);
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="smart" aria-label="Smart threading">
                <Sparkles className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="byReferences"
                aria-label="Thread by references"
              >
                <GitBranch className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="bySubject" aria-label="Thread by subject">
                <ListIcon className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="byParticipants"
                aria-label="Thread by participants"
              >
                <AtSign className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* View mode toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(val) => {
                if (val) onSetViewMode(val as "list" | "timeline");
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="list" aria-label="List view">
                <ListIcon className="h-3.5 w-3.5" />
                <span className="ml-1 text-xs">List</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="timeline" aria-label="Timeline view">
                <GitCompare className="h-3.5 w-3.5" />
                <span className="ml-1 text-xs">Timeline</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </div>

      {/* Thread info (when a thread is selected) */}
      {thread && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-[var(--color-fg)]">
            {thread.subject}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Participants */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {thread.participants.slice(0, 5).map((p) => (
                  <Avatar
                    key={p.address}
                    className="h-6 w-6 border-2 border-[var(--color-bg)]"
                  >
                    <AvatarFallback className="text-[10px]">
                      {getInitials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-[var(--color-muted-fg)]">
                <Users className="mr-1 inline h-3 w-3" />
                {thread.participants.length} participants
              </span>
            </div>

            {/* Message count */}
            <Badge variant="secondary" className="gap-1">
              <MessagesSquare className="h-3 w-3" />
              {thread.messageCount}{" "}
              {thread.messageCount === 1 ? "message" : "messages"}
            </Badge>

            {/* Unread count */}
            {thread.unreadCount > 0 && (
              <Badge className="gap-1 bg-[var(--color-brand-500)]">
                {thread.unreadCount} unread
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
