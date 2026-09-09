"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEmailStore } from "@/stores/email-store";

export type ReadDelayOption = "immediate" | "5s" | "10s" | "30s" | "manual";

const READ_DELAY_VALUES: Record<ReadDelayOption, number> = {
  immediate: 0,
  "5s": 5000,
  "10s": 10000,
  "30s": 30000,
  manual: -1,
};

const STORAGE_KEY = "misfits_read_delay";

export function getStoredReadDelay(): ReadDelayOption {
  if (typeof window === "undefined") return "immediate";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in READ_DELAY_VALUES) return stored as ReadDelayOption;
  return "immediate";
}

export function setStoredReadDelay(option: ReadDelayOption): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, option);
}

export function useAutoMarkRead(emailId: string | null, isRead: boolean) {
  const [markRead] = useEmailStore((s) => [s.markRead]);
  const [pendingMarkRead, setPendingMarkRead] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readDelay, setReadDelay] = useState<ReadDelayOption>("immediate");

  useEffect(() => {
    setReadDelay(getStoredReadDelay());
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!emailId || isRead || readDelay === "manual") {
      setPendingMarkRead(false);
      return;
    }

    const delay = READ_DELAY_VALUES[readDelay];
    if (delay <= 0) {
      // Immediate
      markRead(emailId);
      setPendingMarkRead(false);
      return;
    }

    setPendingMarkRead(true);
    timerRef.current = setTimeout(() => {
      markRead(emailId);
      setPendingMarkRead(false);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [emailId, isRead, readDelay, markRead]);

  const cancelPendingMarkRead = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPendingMarkRead(false);
  }, []);

  const manualMarkRead = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (emailId) markRead(emailId);
    setPendingMarkRead(false);
  }, [emailId, markRead]);

  return {
    pendingMarkRead,
    cancelPendingMarkRead,
    manualMarkRead,
    readDelay,
    setReadDelay: (option: ReadDelayOption) => {
      setStoredReadDelay(option);
      setReadDelay(option);
    },
  };
}

export default useAutoMarkRead;
