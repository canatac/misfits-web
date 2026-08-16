"use client";

/**
 * Email List — toolbar (search, filter tabs, sort dropdown, bulk actions),
 * email rows, loading skeleton, and empty state.
 * Keyboard navigation: j/k to move, e to archive, # to delete, Enter to open.
 */
import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEmailStore, useFilteredSortedEmails } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useThreads, useThreadActions } from "@/hooks/use-threads";
import { EmailListItem } from "@/components/mail/email-list-item";
import { ThreadListItem } from "@/components/mail/thread-list-item";
import { ThreadHeader } from "@/components/mail/thread-header";
import { EmailListToolbar } from "@/components/mail/parts/email-list/email-list-toolbar";
import {
  EmailListSkeleton,
  EmailListEmpty,
} from "@/components/mail/parts/email-list/email-list-states";

interface EmailListProps {
  className?: string;
}

export function EmailList({ className }: EmailListProps) {
  const filteredEmails = useFilteredSortedEmails();
  const loading = useEmailStore((s) => s.loading);
  const emails = useEmailStore((s) => s.emails);
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

  const threads = useThreads();
  const { replyToThread } = useThreadActions();

  const searchRef = useRef<HTMLInputElement>(null);
  const baselineTopEmailIdRef = useRef<string | null>(null);
  const [newEmailsCount, setNewEmailsCount] = useState(0);

  useEffect(() => {
    fetchEmails(currentFolder);
  }, [fetchEmails, currentFolder]);

  useEffect(() => {
    let cancelled = false;
    const refreshPreservingSelection = () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      if (useEmailStore.getState().loading) return;
      void fetchEmails(currentFolder, { preserveSelection: true });
    };
    const interval = window.setInterval(refreshPreservingSelection, 15_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshPreservingSelection();
    };
    window.addEventListener("focus", refreshPreservingSelection);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshPreservingSelection);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchEmails, currentFolder]);

  useEffect(() => {
    if (loading) return;
    const topId = emails[0]?.id ?? null;
    const baselineId = baselineTopEmailIdRef.current;
    if (!baselineId) {
      baselineTopEmailIdRef.current = topId;
      return;
    }
    if (!topId || topId === baselineId) return;
    const baselineIndex = emails.findIndex((e) => e.id === baselineId);
    const incoming = baselineIndex === -1 ? emails.length : baselineIndex;
    if (incoming > 0) setNewEmailsCount(incoming);
  }, [emails, loading]);

  const acknowledgeNewEmails = useCallback(() => {
    baselineTopEmailIdRef.current = emails[0]?.id ?? null;
    setNewEmailsCount(0);
  }, [emails]);

  const handleManualRefresh = useCallback(() => {
    void fetchEmails(currentFolder, { preserveSelection: true }).then(() => {
      baselineTopEmailIdRef.current =
        useEmailStore.getState().emails[0]?.id ?? null;
      setNewEmailsCount(0);
    });
  }, [fetchEmails, currentFolder]);

  const navigateEmail = useCallback(
    (direction: "next" | "prev") => {
      if (filteredEmails.length === 0) return;
      const currentIndex = filteredEmails.findIndex(
        (e) => e.id === selectedEmailId
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
    [filteredEmails, selectedEmailId, selectEmail]
  );

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    (window as Window & { __mailFocusSearch?: () => void }).__mailFocusSearch =
      focusSearch;
    return () => {
      delete (window as Window & { __mailFocusSearch?: () => void })
        .__mailFocusSearch;
    };
  }, [focusSearch]);

  const handleArchive = useCallback(() => {
    if (selectedEmailIds.size > 0) bulkAction("archive");
    else if (selectedEmailId) archive(selectedEmailId);
  }, [selectedEmailIds, selectedEmailId, bulkAction, archive]);

  const handleDelete = useCallback(() => {
    if (selectedEmailIds.size > 0) bulkAction("delete");
    else if (selectedEmailId) deleteEmail(selectedEmailId);
  }, [selectedEmailIds, selectedEmailId, bulkAction, deleteEmail]);

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
        className
      )}
      data-testid="email-list"
    >
      <EmailListToolbar
        searchRef={searchRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterType={filterType}
        setFilterType={setFilterType}
        loading={loading}
        onManualRefresh={handleManualRefresh}
        newEmailsCount={newEmailsCount}
        acknowledgeNewEmails={acknowledgeNewEmails}
        hasSelection={hasSelection}
        selectedCount={selectedEmailIds.size}
        bulkAction={bulkAction}
        clearSelection={clearSelection}
        showSelectAll={filteredEmails.length > 0 && !loading}
        allSelected={allSelected}
        onSelectAll={handleSelectAll}
        visibleCount={filteredEmails.length}
      />

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

      <ScrollArea className="flex-1">
        {loading ? (
          <EmailListSkeleton />
        ) : filteredEmails.length === 0 ? (
          <EmailListEmpty />
        ) : threadingEnabled && threads.length > 0 ? (
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
            <div className="h-4" aria-hidden="true" />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
