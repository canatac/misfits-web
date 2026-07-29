"use client";

/**
 * Mail Sidebar — folders, labels, account selector, compose button.
 * Collapsible on mobile via hamburger menu. Uses dynamic labels from the
 * label store (Issue #146) instead of the static mock list.
 */
import { useState } from "react";
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  AlertCircle,
  Mail,
  ChevronDown,
  PenSquare,
  Tag,
  Settings2,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEmailStore } from "@/stores/email-store";
import { useLabelStore } from "@/stores/label-store";
import { useSnoozeStore } from "@/stores/snooze-store";
import { LabelManager } from "@/components/mail/label-manager";
import { FilterEditor } from "@/components/mail/filter-editor";
import { SnoozePicker } from "@/components/mail/snooze-picker";
import { TriagePanel } from "@/components/mail/triage-panel";
import type { Folder } from "@/types/email";
import type { LabelTree } from "@/types/label";

const FOLDER_ICONS: Record<string, typeof Inbox> = {
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  AlertCircle,
};

const ACCOUNTS = [
  { id: "acc-1", email: "hermes@misfits.ai", name: "Hermes", avatar: "H" },
  { id: "acc-2", email: "personal@gmail.com", name: "Personal", avatar: "P" },
];

interface SidebarProps {
  className?: string;
  onCompose?: () => void;
}

export function MailSidebar({ className, onCompose }: SidebarProps) {
  const folders = useEmailStore((s) => s.folders);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const setFolder = useEmailStore((s) => s.setFolder);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);

  const labelTree = useLabelStore((s) => s.getLabelTree());
  const snoozedCount = useSnoozeStore((s) => s.snoozedEmails.length);

  const [activeAccount, setActiveAccount] = useState(ACCOUNTS[0]);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [filterEditorOpen, setFilterEditorOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-[var(--color-card)] border-r border-[var(--color-border)]",
        className,
      )}
      data-testid="mail-sidebar"
    >
      {/* Account selector */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{activeAccount.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start gap-0">
                <span className="text-sm font-medium">{activeAccount.name}</span>
                <span className="text-xs text-[var(--color-muted-fg)]">
                  {activeAccount.email}
                </span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-[var(--color-muted-fg)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Accounts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ACCOUNTS.map((acc) => (
              <DropdownMenuItem
                key={acc.id}
                onClick={() => setActiveAccount(acc)}
                className="gap-3"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback>{acc.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{acc.name}</span>
                  <span className="text-xs text-[var(--color-muted-fg)]">
                    {acc.email}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-[var(--color-brand-500)]">
              <Mail className="h-4 w-4" />
              Add account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Compose button */}
      <div className="px-3 pb-2">
        <Button
          className="w-full justify-start gap-2"
          onClick={onCompose}
          data-testid="compose-button"
        >
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* AI triage toggle */}
      <div className="px-3 pb-2">
        <Button
          variant={triageOpen ? "secondary" : "outline"}
          className="w-full justify-start gap-2"
          onClick={() => setTriageOpen((v) => !v)}
          data-testid="triage-toggle"
          aria-expanded={triageOpen}
        >
          <Zap className="h-4 w-4 text-[var(--color-warning-500)]" />
          AI Triage
        </Button>
      </div>

      <Separator />

      {/* Folders + Labels */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-3" aria-label="Mail folders">
          {folders.map((folder) => {
            const Icon = FOLDER_ICONS[folder.icon] ?? Inbox;
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setFolder(folder.id as Folder)}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-medium"
                    : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">{folder.name}</span>
                {folder.unreadCount > 0 && (
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {folder.unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <Separator />

        <div className="p-3">
          <div className="mb-2 flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
              <Tag className="h-3 w-3" />
              Labels
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Manage labels"
                onClick={() => setLabelManagerOpen(true)}
                className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Manage filters"
                onClick={() => setFilterEditorOpen(true)}
                className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
              >
                <Clock className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {labelTree.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--color-muted-fg)]">
                No labels. Use the gear to create some.
              </p>
            )}
            {labelTree.map((label) => (
              <LabelTreeNode
                key={label.id}
                node={label}
                depth={0}
                onFilter={() => setSearchQuery(label.name)}
              />
            ))}
          </div>
        </div>

        {snoozedCount > 0 && (
          <>
            <Separator />
            <div className="p-3">
              <div className="mb-1 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
                <Clock className="h-3 w-3" />
                Snoozed
              </div>
              <SnoozePicker triggerLabel={`Snoozed (${snoozedCount})`} className="w-full justify-start" />
            </div>
          </>
        )}

        {/* AI triage panel (Issue #148) — toggled by the button above */}
        {triageOpen && (
          <>
            <Separator />
            <TriagePanel emails={[]} />
          </>
        )}
      </ScrollArea>

      <LabelManager open={labelManagerOpen} onOpenChange={setLabelManagerOpen} />
      <FilterEditor open={filterEditorOpen} onOpenChange={setFilterEditorOpen} />
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Recursive label tree node for the sidebar                          */
/* ------------------------------------------------------------------ */

function LabelTreeNode({
  node,
  depth,
  onFilter,
}: {
  node: LabelTree;
  depth: number;
  onFilter: (name: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="flex h-4 w-4 items-center justify-center text-[var(--color-muted-fg)]"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", !expanded && "-rotate-90")} />
          </button>
        ) : (
          <span className="h-4 w-4" />
        )}
        <button
          type="button"
          onClick={() => onFilter(node.name)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: node.color }}
            aria-hidden="true"
          />
          <span className="flex-1">{node.name}</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <LabelTreeNode key={child.id} node={child} depth={depth + 1} onFilter={onFilter} />
          ))}
        </div>
      )}
    </div>
  );
}
