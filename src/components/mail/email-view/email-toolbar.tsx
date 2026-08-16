"use client";

import {
  Star,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  MoreHorizontal,
  MailOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface EmailToolbarProps {
  isStarred: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onMarkUnread: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onToggleStar: () => void;
  onHermesSummarize: () => void;
  onHermesReplyDraft: () => void;
  onHermesTranslate: () => void;
  onHermesTodos: () => void;
}

export function EmailToolbar({
  isStarred,
  onArchive,
  onDelete,
  onMarkUnread,
  onReply,
  onReplyAll,
  onForward,
  onToggleStar,
  onHermesSummarize,
  onHermesReplyDraft,
  onHermesTranslate,
  onHermesTodos,
}: EmailToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-[#242427] bg-[#121214] px-3 py-2">
      <div className="mr-2 rounded-lg border border-[#242427] bg-[#0A0A0B] px-2 py-1 font-mono text-[10px] text-[#C49B66]">
        Focus reader
      </div>
      <Button variant="ghost" size="icon" onClick={onArchive} aria-label="Archive">
        <Archive className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMarkUnread}
        aria-label="Mark as unread"
      >
        <MailOpen className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button variant="ghost" size="sm" onClick={onReply} className="gap-1.5">
        <Reply className="h-4 w-4" />
        Reply
      </Button>
      <Button variant="ghost" size="sm" onClick={onReplyAll} className="gap-1.5">
        <ReplyAll className="h-4 w-4" />
        Reply All
      </Button>
      <Button variant="ghost" size="sm" onClick={onForward} className="gap-1.5">
        <Forward className="h-4 w-4" />
        Forward
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            aria-label="Demander à Hermes"
          >
            <Sparkles className="h-4 w-4" />
            Demander à Hermes
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Actions Hermes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onHermesSummarize}>Résumer</DropdownMenuItem>
          <DropdownMenuItem onClick={onHermesReplyDraft}>
            Proposer réponse
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onHermesTranslate}>Traduire</DropdownMenuItem>
          <DropdownMenuItem onClick={onHermesTodos}>Extraire TODO</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleStar}
        aria-label={isStarred ? "Unstar" : "Star"}
      >
        <Star
          className={cn(
            "h-4 w-4",
            isStarred
              ? "fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
              : ""
          )}
        />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onMarkUnread}>
            <MailOpen className="mr-2 h-4 w-4" />
            Mark as unread
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-[var(--color-danger-500)]"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
