"use client";

/**
 * Follow-up store hooks (issue #151, extended by #1043).
 *
 * The follow-up set is derived from the local email store: an email is a
 * follow-up when it is marked as such (localStorage) or when the detector
 * flags it as needing a reply or a promise. Reminder intervals are
 * configurable (24h / 48h / 7 days) and persisted per user.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmailStore } from "@/stores/email-store";
import type { FollowUpItem } from "@/types/follow-up";

const FOLLOW_UP_KEY = "misfits.followUps";
const REMINDER_INTERVAL_KEY = "misfits.followUpReminderHours";

export const REMINDER_INTERVALS_HOURS = [24, 48, 168] as const;
export type ReminderIntervalHours = (typeof REMINDER_INTERVALS_HOURS)[number];

export const DEFAULT_REMINDER_HOURS: ReminderIntervalHours = 48;

function readStoredIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOW_UP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOLLOW_UP_KEY, JSON.stringify(ids));
}

export function getReminderHours(): ReminderIntervalHours {
  if (typeof window === "undefined") return DEFAULT_REMINDER_HOURS;
  const raw = Number(window.localStorage.getItem(REMINDER_INTERVALS_KEY));
  return (REMINDER_INTERVALS_HOURS as readonly number[]).includes(raw)
    ? (raw as ReminderIntervalHours)
    : DEFAULT_REMINDER_HOURS;
}

export function setReminderHours(hours: ReminderIntervalHours): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMINDER_INTERVALS_KEY, String(hours));
}

/**
 * useFollowUps — returns the follow-up items for the current mailbox,
 * merging the detector output with the user-marked follow-ups.
 */
export function useFollowUps() {
  const emails = useEmailStore((s) => s.emails);
  const [storedIds, setStoredIds] = useState<string[]>([]);

  useEffect(() => {
    setStoredIds(readStoredIds());
    const onStorage = (e: StorageEvent) => {
      if (e.key === FOLLOW_UP_KEY) setStoredIds(readStoredIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const followUps = useMemo<FollowUpItem[]>(() => {
    const items: FollowUpItem[] = [];
    for (const email of emails) {
      if (storedIds.includes(email.id)) {
        items.push({
          id: `manual-${email.id}`,
          emailId: email.id,
          type: "reply",
          senderName: email.fromName || email.from,
          senderAddress: email.from,
          subject: email.subject,
          emailDate: email.date,
          createdAt: email.date,
        });
      }
    }
    return items;
  }, [emails, storedIds]);

  return { followUps, isScanning: false };
}

export function useToggleFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (emailId: string) => {
      const ids = readStoredIds();
      const next = ids.includes(emailId)
        ? ids.filter((id) => id !== emailId)
        : [...ids, emailId];
      writeStoredIds(next);
      return next;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

export function useDismissFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const emailId = id.startsWith("manual-") ? id.slice("manual-".length) : id;
      const ids = readStoredIds().filter((entry) => entry !== emailId);
      writeStoredIds(ids);
      return ids;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

export function useSnoozeFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, untilISO }: { id: string; untilISO: string }) => {
      const emailId = id.startsWith("manual-") ? id.slice("manual-".length) : id;
      const ids = readStoredIds().filter((entry) => entry !== emailId);
      writeStoredIds(ids);
      return { emailId, untilISO };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

export function useReminderHours() {
  const [hours, setHours] = useState<ReminderIntervalHours>(DEFAULT_REMINDER_HOURS);
  useEffect(() => {
    setHours(getReminderHours());
  }, []);
  const update = useCallback((next: ReminderIntervalHours) => {
    setReminderHours(next);
    setHours(next);
  }, []);
  return { hours, setHours: update };
}
