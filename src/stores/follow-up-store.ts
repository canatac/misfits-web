/**
 * Zustand store for follow-up tracking & reminders (Issue #151).
 * Persists detected follow-up items and active reminders to localStorage.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  FollowUpItem,
  FollowUpReminder,
  ReminderRule,
} from "@/types/follow-up";
import type { Email } from "@/types/email";
import {
  detectFollowUps,
  generateReminders,
  DEFAULT_RULES,
} from "@/lib/follow-up-detector";

interface FollowUpState {
  /** All detected follow-up items. */
  followUps: FollowUpItem[];
  /** Currently surfaced reminders (derived, persisted for offline). */
  reminders: FollowUpReminder[];
  /** Whether a scan is in progress. */
  isScanning: boolean;
  /** Last scan timestamp (ISO). */
  lastScanAt: string | null;
  /** Detection rules (persisted so the user can tweak them later). */
  rules: ReminderRule[];

  // Actions
  /** Scan a list of emails and update the follow-up items. */
  scanEmails: (emails: Email[]) => void;
  /** Dismiss a follow-up item (marks it as dismissed). */
  dismissFollowUp: (id: string) => void;
  /** Snooze a follow-up item until the given ISO date. */
  snoozeFollowUp: (id: string, untilISO: string) => void;
  /** Mark a follow-up item as completed. */
  completeFollowUp: (id: string) => void;
  /** Recompute reminders from the current follow-up items. */
  getReminders: () => FollowUpReminder[];
  /** Clear all follow-ups and reminders. */
  clearAll: () => void;
  /** Update a rule's enabled flag. */
  toggleRule: (ruleId: string, enabled: boolean) => void;
}

function mergeFollowUps(
  existing: FollowUpItem[],
  detected: FollowUpItem[],
): FollowUpItem[] {
  const byEmailType = new Map<string, FollowUpItem>();
  for (const fu of existing) {
    // Preserve user actions on existing items; remove dismissed/completed.
    if (fu.status === "dismissed" || fu.status === "completed") {
      byEmailType.set(`${fu.emailId}:${fu.type}`, fu);
    }
  }
  for (const fu of detected) {
    const key = `${fu.emailId}:${fu.type}`;
    const prev = byEmailType.get(key);
    if (prev && (prev.status === "dismissed" || prev.status === "completed")) {
      // Keep the user's decision; don't re-surface.
      continue;
    }
    if (prev && prev.status === "snoozed") {
      // Preserve snooze but refresh other fields.
      byEmailType.set(key, { ...fu, status: "snoozed", snoozedUntil: prev.snoozedUntil, updatedAt: new Date().toISOString() });
    } else {
      byEmailType.set(key, fu);
    }
  }
  return Array.from(byEmailType.values());
}

export const useFollowUpStore = create<FollowUpState>()(
  persist(
    (set, get) => ({
      followUps: [],
      reminders: [],
      isScanning: false,
      lastScanAt: null,
      rules: DEFAULT_RULES,

      scanEmails: (emails) => {
        set({ isScanning: true });
        try {
          const detected = detectFollowUps(emails, get().rules);
          const merged = mergeFollowUps(get().followUps, detected);
          const reminders = generateReminders(merged);
          set({
            followUps: merged,
            reminders,
            isScanning: false,
            lastScanAt: new Date().toISOString(),
          });
        } catch {
          set({ isScanning: false });
        }
      },

      dismissFollowUp: (id) => {
        set((state) => {
          const followUps = state.followUps.map((fu) =>
            fu.id === id
              ? { ...fu, status: "dismissed" as const, updatedAt: new Date().toISOString() }
              : fu,
          );
          return {
            followUps,
            reminders: generateReminders(followUps),
          };
        });
      },

      snoozeFollowUp: (id, untilISO) => {
        set((state) => {
          const followUps = state.followUps.map((fu) =>
            fu.id === id
              ? {
                  ...fu,
                  status: "snoozed" as const,
                  snoozedUntil: untilISO,
                  updatedAt: new Date().toISOString(),
                }
              : fu,
          );
          return {
            followUps,
            reminders: generateReminders(followUps),
          };
        });
      },

      completeFollowUp: (id) => {
        set((state) => {
          const followUps = state.followUps.map((fu) =>
            fu.id === id
              ? { ...fu, status: "completed" as const, updatedAt: new Date().toISOString() }
              : fu,
          );
          return {
            followUps,
            reminders: generateReminders(followUps),
          };
        });
      },

      getReminders: () => {
        const reminders = generateReminders(get().followUps);
        set({ reminders });
        return reminders;
      },

      clearAll: () => {
        set({ followUps: [], reminders: [], lastScanAt: null });
      },

      toggleRule: (ruleId, enabled) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, enabled } : r,
          ),
        }));
      },
    }),
    {
      name: "misfits-follow-ups",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        followUps: state.followUps,
        rules: state.rules,
        lastScanAt: state.lastScanAt,
      }),
    },
  ),
);
