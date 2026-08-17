"use client";

/**
 * Custom hooks extracted from EmailList to keep the component under LOC budget.
 * - useEmailListAutoRefresh: 15s polling + focus/visibility refresh preserving selection.
 * - useNewEmailTracker: tracks new incoming emails against a baseline top-id.
 * - useMailWindowHotkeys: wires nav/archive/delete/focus-search on window globals.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useEmailStore } from "@/stores/email-store";
import type { Folder } from "@/types/email";

export function useEmailListAutoRefresh(currentFolder: Folder) {
  const fetchEmails = useEmailStore((s) => s.fetchEmails);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      if (useEmailStore.getState().loading) return;
      void fetchEmails(currentFolder, { preserveSelection: true });
    };
    const interval = window.setInterval(refresh, 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchEmails, currentFolder]);
}

export function useNewEmailTracker(
  emails: Array<{ id: string }>,
  loading: boolean,
  currentFolder: Folder,
) {
  const fetchEmails = useEmailStore((s) => s.fetchEmails);
  const baselineTopEmailIdRef = useRef<string | null>(null);
  const [newEmailsCount, setNewEmailsCount] = useState(0);

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

  return { newEmailsCount, acknowledgeNewEmails, handleManualRefresh };
}

export function useMailWindowHotkeys(opts: {
  focusSearch: () => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  archive: () => void;
  del: () => void;
}) {
  const { focusSearch, navigateNext, navigatePrev, archive, del } = opts;
  useEffect(() => {
    const w = window as Window & {
      __mailFocusSearch?: () => void;
      __mailNavNext?: () => void;
      __mailNavPrev?: () => void;
      __mailArchive?: () => void;
      __mailDelete?: () => void;
    };
    w.__mailFocusSearch = focusSearch;
    w.__mailNavNext = navigateNext;
    w.__mailNavPrev = navigatePrev;
    w.__mailArchive = archive;
    w.__mailDelete = del;
    return () => {
      delete w.__mailFocusSearch;
      delete w.__mailNavNext;
      delete w.__mailNavPrev;
      delete w.__mailArchive;
      delete w.__mailDelete;
    };
  }, [focusSearch, navigateNext, navigatePrev, archive, del]);
}
