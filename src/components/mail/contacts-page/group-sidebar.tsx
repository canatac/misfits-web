"use client";

/**
 * ContactGroupSidebar — left rail of the contacts page.
 *
 * Extracted from `contacts-page.tsx` (cycle 31 LOC reduction). Renders the
 * "All contacts" / "Ungrouped" shortcuts, the user-defined groups, and the
 * duplicates cleanup banner. Purely presentational: parent owns state.
 */
import Link from "next/link";
import {
  Plus,
  Users,
  GitMerge,
  ArrowLeft,
  Contact as ContactIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Contact, ContactGroup } from "@/types/contact";

interface ContactGroupSidebarProps {
  contacts: Contact[];
  groups: ContactGroup[];
  groupCounts: Map<string, number>;
  ungroupedCount: number;
  duplicatesCount: number;
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  setQuery: (q: string) => void;
  onAddGroup: () => void;
}

export function ContactGroupSidebar({
  contacts,
  groups,
  groupCounts,
  ungroupedCount,
  duplicatesCount,
  activeGroupId,
  setActiveGroupId,
  setQuery,
  onAddGroup,
}: ContactGroupSidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] md:flex">
      <div className="flex items-center gap-2 p-3">
        <Link
          href="/mail"
          className="rounded-md p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
          aria-label="Back to mail"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ContactIcon className="h-4 w-4" />
          Contacts
        </span>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-3">
          <button
            onClick={() => {
              setActiveGroupId(null);
              setQuery("");
            }}
            className={cn(
              "flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm",
              activeGroupId === null
                ? "bg-[var(--color-accent)] font-medium text-[var(--color-accent-fg)]"
                : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]"
            )}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All contacts
            </span>
            <Badge variant="secondary">{contacts.length}</Badge>
          </button>

          <button
            onClick={() => setActiveGroupId("__ungrouped__")}
            className={cn(
              "flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm",
              activeGroupId === "__ungrouped__"
                ? "bg-[var(--color-accent)] font-medium text-[var(--color-accent-fg)]"
                : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]"
            )}
          >
            <span>Ungrouped</span>
            <Badge variant="secondary">{ungroupedCount}</Badge>
          </button>

          <div className="mt-3 mb-1 flex items-center justify-between px-3">
            <span className="text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
              Groups
            </span>
            <button
              onClick={onAddGroup}
              className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
              aria-label="Add group"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {groups.length === 0 && (
            <p className="px-3 py-2 text-xs text-[var(--color-muted-fg)]">
              No groups yet.
            </p>
          )}
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroupId(g.id)}
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm",
                activeGroupId === g.id
                  ? "bg-[var(--color-accent)] font-medium text-[var(--color-accent-fg)]"
                  : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                {g.name}
              </span>
              <Badge variant="secondary">{groupCounts.get(g.id) ?? 0}</Badge>
            </button>
          ))}

          {duplicatesCount > 0 && (
            <>
              <div className="mt-3 mb-1 px-3 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
                Cleanup
              </div>
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning-500)]/10 px-3 py-2 text-xs text-[var(--color-warning-500)]">
                <GitMerge className="h-3.5 w-3.5" />
                {duplicatesCount} duplicate
                {duplicatesCount === 1 ? "" : "s"} to review
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
