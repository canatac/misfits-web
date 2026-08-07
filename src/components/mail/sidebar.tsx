"use client";

/**
 * Mail Sidebar — folders, labels, account selector, compose button.
 * Collapsible on mobile via hamburger menu. Uses dynamic labels from the
 * label store (Issue #146) instead of the static mock list.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
  Calendar as CalendarIcon,
  Newspaper,
  Languages,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogoutAction } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEmailStore } from "@/stores/email-store";
import { useLabelStore, buildLabelTree } from "@/stores/label-store";
import { useSnoozeStore } from "@/stores/snooze-store";
import { AccountSelector } from "@/components/mail/account-selector";
import { LabelManager } from "@/components/mail/label-manager";
import { FilterEditor } from "@/components/mail/filter-editor";
import { SnoozePicker } from "@/components/mail/snooze-picker";
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

interface SidebarProps {
  className?: string;
  onCompose?: () => void;
}

export function MailSidebar({ className, onCompose }: SidebarProps) {
  const pathname = usePathname();
  const folders = useEmailStore((s) => s.folders);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const setFolder = useEmailStore((s) => s.setFolder);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);

  // NEVER select s.getLabelTree() directly — it allocates a new array every
  // call, so Zustand sees a changed snapshot every render → React #185
  // (Maximum update depth exceeded) on /mail.
  const labels = useLabelStore((s) => s.labels);
  const labelTree = useMemo(() => buildLabelTree(labels), [labels]);
  const snoozedCount = useSnoozeStore((s) => s.snoozedEmails.length);

  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [filterEditorOpen, setFilterEditorOpen] = useState(false);

  const navClass = (active: boolean) =>
    cn(
      "w-full justify-start gap-2 border border-[#262629] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]",
      active && "border-[#C49B66]/50 bg-[#1E1A15] text-[#F2D5A7] hover:bg-[#1E1A15]",
    );

  const isActivePath = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-[#242427] bg-[#101012]/95 text-[#E4E4E7] backdrop-blur",
        className,
      )}
      data-testid="mail-sidebar"
    >
      {/* Account selector — multi-account + unified inbox (Issue #154) */}
      <div className="p-3">
        <AccountSelector />
      </div>

      {/* Compose button */}
      <div className="px-3 pb-2">
        <Button
          className="w-full justify-start gap-2 border border-[#C49B66]/40 bg-[#C49B66] text-[#0A0A0B] hover:bg-[#b78f5c]"
          onClick={onCompose}
          data-testid="compose-button"
        >
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Calendar link (Issue #153) — opens the integrated calendar */}
      <div className="px-3 pb-2">
        <Button
          asChild
          variant="outline"
          className={navClass(isActivePath("/calendar"))}
          data-testid="calendar-link"
        >
          <Link href="/calendar">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </Link>
        </Button>
      </div>

      {/* Novamail parity modules */}
      <div className="px-3 pb-2">
        <Button
          asChild
          variant="outline"
          className={navClass(isActivePath("/newsletters"))}
          data-testid="newsletters-link"
        >
          <Link href="/newsletters">
            <Newspaper className="h-4 w-4" />
            Newsletters
          </Link>
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button
          asChild
          variant="outline"
          className={navClass(isActivePath("/translation"))}
          data-testid="translation-link"
        >
          <Link href="/translation">
            <Languages className="h-4 w-4" />
            Translation
          </Link>
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button
          asChild
          variant="outline"
          className={navClass(isActivePath("/docs"))}
          data-testid="docs-link"
        >
          <Link href="/docs">
            <BookOpen className="h-4 w-4" />
            Docs
          </Link>
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
                  "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-[#C49B66]/50 bg-[#1E1A15] text-[#F2D5A7] font-medium"
                    : "text-[#D4D4D8] hover:border-[#2A2A2D] hover:bg-[#1A1A1E]",
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

      </ScrollArea>

      <LabelManager open={labelManagerOpen} onOpenChange={setLabelManagerOpen} />
      <FilterEditor open={filterEditorOpen} onOpenChange={setFilterEditorOpen} />

      <Separator />
      <div className="p-3">
        <LogoutButton />
      </div>
    </aside>
  );
}

function LogoutButton() {
  const logout = useLogoutAction();
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 text-[var(--color-muted-fg)] hover:text-[var(--color-danger-500)]"
      onClick={logout}
      data-testid="logout-button"
    >
      <LogOut className="h-4 w-4" />
      Se déconnecter
    </Button>
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
