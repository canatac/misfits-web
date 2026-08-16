"use client";

/**
 * Mail Sidebar — folders, labels, account selector, compose button.
 */
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  AlertCircle,
  PenSquare,
  Tag,
  Settings2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

import { WorkspaceNavItems } from "./sidebar-parts/workspace-nav-items";
import { LabelTreeNode } from "./sidebar-parts/label-tree-node";
import { LogoutButton } from "./sidebar-parts/logout-button";

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
  const router = useRouter();
  const folders = useEmailStore((s) => s.folders);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const setFolder = useEmailStore((s) => s.setFolder);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);

  const labels = useLabelStore((s) => s.labels);
  const labelTree = useMemo(() => buildLabelTree(labels), [labels]);
  const snoozedCount = useSnoozeStore((s) => s.snoozedEmails.length);

  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [filterEditorOpen, setFilterEditorOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-[#242427] bg-[#101012]/95 text-[#E4E4E7] backdrop-blur",
        className
      )}
      data-testid="mail-sidebar"
    >
      <div className="p-3">
        <AccountSelector />
      </div>

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

      <WorkspaceNavItems />

      <Separator />

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-3" aria-label="Mail folders">
          {folders.map((folder) => {
            const Icon = FOLDER_ICONS[folder.icon] ?? Inbox;
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  setFolder(folder.id as Folder);
                  if (!pathname.startsWith("/mail")) {
                    router.push("/mail");
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-[#C49B66]/50 bg-[#1E1A15] font-medium text-[#F2D5A7]"
                    : "text-[#D4D4D8] hover:border-[#2A2A2D] hover:bg-[#1A1A1E]"
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
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
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
              <div className="mb-1 flex items-center gap-2 px-3 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
                <Clock className="h-3 w-3" />
                Snoozed
              </div>
              <SnoozePicker
                triggerLabel={`Snoozed (${snoozedCount})`}
                className="w-full justify-start"
              />
            </div>
          </>
        )}
      </ScrollArea>

      <LabelManager
        open={labelManagerOpen}
        onOpenChange={setLabelManagerOpen}
      />
      <FilterEditor
        open={filterEditorOpen}
        onOpenChange={setFilterEditorOpen}
      />

      <Separator />
      <div className="p-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
