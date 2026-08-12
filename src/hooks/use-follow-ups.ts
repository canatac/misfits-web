/**
 * Follow-up hooks — TanStack Query wrappers around the follow-up store
 * (Issue #151). Provides query + mutation hooks for the UI layer.
 */
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFollowUpStore } from "@/stores/follow-up-store";
import type { FollowUpItem, FollowUpReminder } from "@/types/follow-up";
import type { Email } from "@/types/email";

/**
 * Query hook: returns all active (non-dismissed, non-completed) follow-up
 * items sorted by due date ascending. Also exposes reminders.
 */
export function useFollowUps(): {
  followUps: FollowUpItem[];
  reminders: FollowUpReminder[];
  isScanning: boolean;
  lastScanAt: string | null;
} {
  const followUps = useFollowUpStore((s) => s.followUps);
  const reminders = useFollowUpStore((s) => s.reminders);
  const isScanning = useFollowUpStore((s) => s.isScanning);
  const lastScanAt = useFollowUpStore((s) => s.lastScanAt);

  const active = followUps
    .filter((fu) => fu.status !== "dismissed" && fu.status !== "completed")
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  return { followUps: active, reminders, isScanning, lastScanAt };
}

/**
 * Mutation hook: scan a batch of emails for follow-ups.
 */
export function useScanEmails() {
  const scanEmails = useFollowUpStore((s) => s.scanEmails);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emails: Email[]) => {
      scanEmails(emails);
      return emails.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

/**
 * Mutation hook: dismiss a follow-up item.
 */
export function useDismissFollowUp() {
  const dismissFollowUp = useFollowUpStore((s) => s.dismissFollowUp);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      dismissFollowUp(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

/**
 * Mutation hook: snooze a follow-up item until a given date.
 */
export function useSnoozeFollowUp() {
  const snoozeFollowUp = useFollowUpStore((s) => s.snoozeFollowUp);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, untilISO }: { id: string; untilISO: string }) => {
      snoozeFollowUp(id, untilISO);
      return { id, untilISO };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

/**
 * Mutation hook: mark a follow-up as completed (reply sent / promise fulfilled).
 */
export function useCompleteFollowUp() {
  const completeFollowUp = useFollowUpStore((s) => s.completeFollowUp);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      completeFollowUp(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

/**
 * Mutation hook: dismiss a reminder (removes from active reminders list
 * by dismissing the underlying follow-up item).
 */
export function useDismissReminder() {
  const dismissFollowUp = useFollowUpStore((s) => s.dismissFollowUp);
  const getReminders = useFollowUpStore((s) => s.getReminders);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (followUpId: string) => {
      dismissFollowUp(followUpId);
      getReminders();
      return followUpId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}
