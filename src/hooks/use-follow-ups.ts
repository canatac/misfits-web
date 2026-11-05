"use client";

/**
 * Follow-up store hooks (issue #151, extended by #1043).
 *
 * The follow-up set is derived from the local email store: an email is a
 * follow-up when it is marked as such (localStorage). Reminder intervals are
 * configurable (24h / 48h / 7 days) and persisted per user.
 *
 * The `reminders` API is kept for the reminder banner (issue #151): it is
 * derived from the active follow-ups whose due date has passed.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmailStore } from "@/stores/email-store";
import type { FollowUpItem, FollowUpReminder } from "@/types/follow-up";

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
  const raw = Number(window.localStorage.getItem(REMINDER_INTERVAL_KEY));
  return (REMINDER_INTERVALS_HOURS as readonly number[]).includes(raw)
    ? (raw as ReminderIntervalHours)
    : DEFAULT_REMINDER_HOURS;
}

export function setReminderHours(hours: ReminderIntervalHours): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMINDER_INTERVAL_KEY, String(hours));
}

/**
 * useFollowUps — returns the follow-up items for the current mailbox,
 * merging the detector output with the user-marked follow-ups, plus the
 * derived reminders for the reminder banner.
 */
export function useFollowUps(): {
  followUps: FollowUpItem[];
  reminders: FollowUpReminder[];
  isScanning: boolean;
  lastScanAt: string | null;
} {
  const emails = useEmailStore((s) => s.emails);
  const [storedIds, setStoredIds] = useState<string[]>([]);
  const [reminderHours, setReminderHoursState] = useState<ReminderIntervalHours>(
    DEFAULT_REMINDER_HOURS
  );

  useEffect(() => {
    setStoredIds(readStoredIds());
    setReminderHoursState(getReminderHours());
    const onStorage = (e: StorageEvent) => {
      if (e.key === FOLLOW_UP_KEY) setStoredIds(readStoredIds());
      if (e.key === REMINDER_INTERVAL_KEY) setReminderHoursState(getReminderHours());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const followUps = useMemo<FollowUpItem[]>(() => {
    const items: FollowUpItem[] = [];
    for (const email of emails) {
      if (storedIds.includes(email.id)) {
        const detectedAt = email.date;
        const dueDate = new Date(
          new Date(email.date).getTime() + reminderHours * 60 * 60 * 1000
        ).toISOString();
        items.push({
          id: `manual-${email.id}`,
          emailId: email.id,
          threadId: email.threadId,
          type: "needs_reply",
          status: "pending",
          senderName: email.from.name || email.from.address,
          senderAddress: email.from.address,
          subject: email.subject,
          emailDate: email.date,
          dueDate,
          detectedAt,
          updatedAt: detectedAt,
          confidence: 0.7,
          source: "rules",
          reasoning: "Marked as follow-up by the user.",
        });
      }
    }
    return items;
  }, [emails, storedIds, reminderHours]);

  const reminders = useMemo<FollowUpReminder[]>(() => {
    const now = Date.now();
    return followUps
      .filter((fu) => new Date(fu.dueDate).getTime() <= now)
      .map((fu) => {
        const daysWaiting = Math.max(
          0,
          Math.floor(
            (now - new Date(fu.emailDate).getTime()) / (24 * 60 * 60 * 1000)
          )
        );
        const overdueDays = Math.max(
          0,
          Math.floor(
            (now - new Date(fu.dueDate).getTime()) / (24 * 60 * 60 * 1000)
          )
        );
        return {
          id: `reminder-${fu.id}`,
          followUpId: fu.id,
          emailId: fu.emailId,
          message:
            overdueDays > 0
              ? `You have not replied to ${fu.senderName} in ${daysWaiting} day${daysWaiting === 1 ? "" : "s"}.`
              : `Follow up with ${fu.senderName} today.`,
          urgency: overdueDays >= 2 ? "urgent" : overdueDays >= 1 ? "warning" : "info",
          senderName: fu.senderName,
          subject: fu.subject,
          daysWaiting,
          createdAt: new Date().toISOString(),
        };
      });
  }, [followUps]);

  return { followUps, reminders, isScanning: false, lastScanAt: null };
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

/**
 * Mutation hook: dismiss a reminder (removes it from the active reminders
 * list by dismissing the underlying follow-up item).
 */
export function useDismissReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (followUpId: string) => {
      const emailId = followUpId.startsWith("manual-")
        ? followUpId.slice("manual-".length)
        : followUpId;
      const ids = readStoredIds().filter((entry) => entry !== emailId);
      writeStoredIds(ids);
      return followUpId;
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
