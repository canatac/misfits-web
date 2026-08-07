"use client";

/**
 * Email List — toolbar (search, filter tabs, sort dropdown, bulk actions),
 * email rows, loading skeleton, and empty state.
 * Keyboard navigation: j/k to move, e to archive, # to delete, Enter to open.
 */
import { useRef, useEffect, useCallback } from "react";
import {
  Search,
  ArrowDownUp,
  Archive,
  Trash2,
  MailOpen,
  X,
  Inbox as InboxIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEmailStore, useFilteredSortedEmails } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useThreads, useThreadActions } from "@/hooks/use-threads";
import { EmailListItem } from "@/components/mail/email-list-item";
import { ThreadListItem } from "@/components/mail/thread-list-item";
import { ThreadHeader } from "@/components/mail/thread-header";
import type { FilterType, SortBy } from "@/types/email";

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "starred", label: "Starred" },
  { value: "attachments", label: "Attachments" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "date", label: "Date (newest)" },
  { value: "sender", label: "Sender (A–Z)" },
  { value: "subject", label: "Subject (A–Z)" },
  { value: "size", label: "Size (largest)" },
  { value: "unreadFirst", label: "Unread first" },
];

interface EmailListProps {
  className?: string;
}

export function EmailList({ className }: EmailListProps) {
  const filteredEmails = useFilteredSortedEmails();
  const loading = useEmailStore((s) => s.loading);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const filterType = useEmailStore((s) => s.filterType);
  const sortBy = useEmailStore((s) => s.sortBy);
  const searchQuery = useEmailStore((s) => s.searchQuery);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectedEmailIds = useEmailStore((s) => s.selectedEmailIds);
  const fetchEmails = useEmailStore((s) => s.fetchEmails);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const toggleStar = useEmailStore((s) => s.toggleStar);
  const archive = useEmailStore((s) => s.archive);
  const deleteEmail = useEmailStore((s) => s.deleteEmail);
  const bulkAction = useEmailStore((s) => s.bulkAction);
  const setFilterType = useEmailStore((s) => s.setFilterType);
  const setSortBy = useEmailStore((s) => s.setSortBy);
  const setSearchQuery = useEmailStore((s) => s.setSearchQuery);
  const toggleEmailSelection = useEmailStore((s) => s.toggleEmailSelection);
  const clearSelection = useEmailStore((s) => s.clearSelection);

  // Threading state
  const threadingEnabled = useThreadStore((s) => s.threadingEnabled);
  const threadingMode = useThreadStore((s) => s.threadingMode);
  const viewMode = useThreadStore((s) => s.viewMode);
  const toggleThreading = useThreadStore((s) => s.toggleThreading);
  const setThreadingMode = useThreadStore((s) => s.setThreadingMode);
  const setViewMode = useThreadStore((s) => s.setViewMode);
  const expandedThreadIds = useThreadStore((s) => s.expandedThreadIds);
  const toggleThreadExpand = useThreadStore((s) => s.toggleThreadExpand);
  const selectThread = useThreadStore((s) => s.selectThread);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);

  // Build threads from the filtered emails
  const threads = useThreads();
  const { replyToThread } = useThreadActions();

  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch emails when folder changes or on mount
  useEffect(() => {
    fetchEmails(currentFolder);
  }, [fetchEmails, currentFolder]);

  // Keyboard navigation within the list
  const navigateEmail = useCallback(
    (direction: "next" | "prev") => {
      if (filteredEmails.length === 0) return;
      const currentIndex = filteredEmails.findIndex(
        (e) => e.id === selectedEmailId,
      );
      let newIndex: number;
      if (currentIndex === -1) {
        newIndex = direction === "next" ? 0 : filteredEmails.length - 1;
      } else {
        newIndex =
          direction === "next"
            ? Math.min(currentIndex + 1, filteredEmails.length - 1)
            : Math.max(currentIndex - 1, 0);
      }
      selectEmail(filteredEmails[newIndex].id);
    },
    [filteredEmails, selectedEmailId, selectEmail],
  );

  // Expose search focus for parent keyboard handler via ref callback
  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  // Store focusSearch on window for the page-level shortcut hook to call
  useEffect(() => {
    (window as Window & { __mailFocusSearch?: () => void }).__mailFocusSearch = focusSearch;
    return () => {
      delete (window as Window & { __mailFocusSearch?: () => void }).__mailFocusSearch;
    };
  }, [focusSearch]);

  const handleArchive = useCallback(() => {
    if (selectedEmailIds.size > 0) {
      bulkAction("archive");
    } else if (selectedEmailId) {
      archive(selectedEmailId);
    }
  }, [selectedEmailIds, selectedEmailId, bulkAction, archive]);

  const handleDelete = useCallback(() => {
    if (selectedEmailIds.size > 0) {
      bulkAction("delete");
    } else if (selectedEmailId) {
      deleteEmail(selectedEmailId);
    }
  }, [selectedEmailIds, selectedEmailId, bulkAction, deleteEmail]);

  // Expose actions on window for the page-level shortcut hook
  useEffect(() => {
    const w = window as Window & {
      __mailNavNext?: () => void;
      __mailNavPrev?: () => void;
      __mailArchive?: () => void;
      __mailDelete?: () => void;
    };
    w.__mailNavNext = () => navigateEmail("next");
    w.__mailNavPrev = () => navigateEmail("prev");
    w.__mailArchive = handleArchive;
    w.__mailDelete = handleDelete;
    return () => {
      delete w.__mailNavNext;
      delete w.__mailNavPrev;
      delete w.__mailArchive;
      delete w.__mailDelete;
    };
  }, [navigateEmail, handleArchive, handleDelete]);

  const hasSelection = selectedEmailIds.size > 0;
  const allSelected =
    hasSelection && filteredEmails.every((e) => selectedEmailIds.has(e.id));

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      filteredEmails.forEach((e) => {
        if (!selectedEmailIds.has(e.id)) toggleEmailSelection(e.id);
      });
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-[#242427] bg-[#0A0A0B] text-[#E0E0E0]",
        className,
      )}
      data-testid="email-list"
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-[#242427] bg-[#121214] p-3">
        {/* Search + Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="Search mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[#242427] bg-[#0A0A0B] pl-9 text-[#E0E0E0] placeholder:text-[#71717A]"
              aria-label="Search emails"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[160px] border-[#242427] bg-[#0A0A0B] text-[#D4D4D8]" aria-label="Sort by">
              <ArrowDownUp className="mr-1 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter tabs + Bulk actions */}
        <div className="flex items-center justify-between gap-2">
          <Tabs
            value={filterType}
            onValueChange={(v) => setFilterType(v as FilterType)}
          >
            <TabsList>
              {FILTER_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Bulk action bar */}
          {hasSelection && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--color-muted-fg)]">
                {selectedEmailIds.size} selected
              </span>
              <Button size="sm" variant="ghost" onClick={() => bulkAction("archive")}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => bulkAction("delete")}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => bulkAction("markRead")}>
                <MailOpen className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Select-all checkbox (only when there are emails) */}
        {filteredEmails.length > 0 && !loading && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all emails"
            />
            <span className="text-xs text-[var(--color-muted-fg)]">
              {filteredEmails.length} {filteredEmails.length === 1 ? "email" : "emails"}
            </span>
          </div>
        )}
      </div>

      {/* Threading header */}
      {threadingEnabled && threads.length > 0 && !loading && (
        <ThreadHeader
          thread={threads.find((t) => t.id === selectedThreadId) ?? null}
          threadingEnabled={threadingEnabled}
          threadingMode={threadingMode}
          viewMode={viewMode}
          onToggleThreading={toggleThreading}
          onSetThreadingMode={setThreadingMode}
          onSetViewMode={setViewMode}
        />
      )}

      {/* Email rows */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-0" data-testid="email-list-skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-[var(--color-border)] p-3"
              >
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmails.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="No emails here"
            description="This folder is empty, or no emails match your current filters."
            size="lg"
          />
        ) : threadingEnabled && threads.length > 0 ? (
          /* Threaded view */
          <div role="listbox" aria-label="Thread list" data-testid="thread-list">
            {threads.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === selectedThreadId}
                isExpanded={expandedThreadIds.has(thread.id)}
                selectedEmailId={selectedEmailId}
                onSelectThread={(tid) => {
                  selectThread(tid);
                  // Also select the last email for the view panel
                  const last = thread.messages[thread.messages.length - 1];
                  if (last) selectEmail(last.id);
                }}
                onSelectEmail={selectEmail}
                onToggleExpand={toggleThreadExpand}
                onReply={replyToThread}
                onArchive={archive}
                onDelete={deleteEmail}
              />
            ))}
            <div className="h-4" aria-hidden="true" />
          </div>
        ) : (
          /* Flat view */
          <div role="listbox" aria-label="Email list">
            {filteredEmails.map((email) => (
              <EmailListItem
                key={email.id}
                email={email}
                isActive={email.id === selectedEmailId}
                isSelected={selectedEmailIds.has(email.id)}
                onSelect={selectEmail}
                onToggleSelection={toggleEmailSelection}
                onToggleStar={toggleStar}
              />
            ))}
            {/* Infinite scroll stub — last item sentinel */}
            <div className="h-4" aria-hidden="true" />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
