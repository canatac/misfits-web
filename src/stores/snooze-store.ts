/**
 * Zustand store for snoozing emails.
 * Preset options, custom date, due-reminder checks, with localStorage persistence.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SnoozedEmail, SnoozePreset, DefaultReminders } from "@/types/label";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function tomorrowMorning(): string {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

function tonight(): string {
  const d = new Date();
  if (d.getHours() >= 18) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

function thisWeekend(): string {
  const d = startOfDay(new Date());
  const day = d.getDay(); // 0 Sun ... 6 Sat
  let add = 6 - day; // Saturday
  if (add <= 0) add += 7; // already past Saturday, next Saturday
  d.setDate(d.getDate() + add);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function nextWeek(): string {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/** Preset snooze options shown in the snooze picker. */
export const SNOOZE_PRESETS: SnoozePreset[] = [
  { id: "tomorrow-morning", label: "Tomorrow morning (8:00 AM)", getUntil: tomorrowMorning },
  { id: "tonight", label: "Tonight (6:00 PM)", getUntil: tonight },
  { id: "this-weekend", label: "This weekend (Sat 9:00 AM)", getUntil: thisWeekend },
  { id: "next-week", label: "Next week (Mon 9:00 AM)", getUntil: nextWeek },
];

interface SnoozeState {
  snoozedEmails: SnoozedEmail[];
  defaultReminders: DefaultReminders;

  // Queries
  getSnoozedEmails: () => SnoozedEmail[];
  isSnoozed: (emailId: string) => boolean;
  /** Returns snoozed emails whose `snoozedUntil` has passed. */
  checkDueReminders: () => SnoozedEmail[];

  // Mutations
  snoozeEmail: (emailId: string, snoozedUntil: string, reminder?: string) => void;
  unsnoozeEmail: (emailId: string) => void;
  setDefaultReminders: (reminders: DefaultReminders) => void;
  /** Remove all snoozes that are due (after the caller has acted on them). */
  clearDueSnoozes: () => void;
}

export const useSnoozeStore = create<SnoozeState>()(
  persist(
    (set, get) => ({
      snoozedEmails: [],
      defaultReminders: { enabled: true, leadMinutes: 0 },

      getSnoozedEmails: () =>
        get()
          .snoozedEmails.slice()
          .sort(
            (a, b) =>
              new Date(a.snoozedUntil).getTime() - new Date(b.snoozedUntil).getTime(),
          ),

      isSnoozed: (emailId) => get().snoozedEmails.some((s) => s.emailId === emailId),

      checkDueReminders: () => {
        const now = Date.now();
        return get().snoozedEmails.filter(
          (s) => new Date(s.snoozedUntil).getTime() <= now,
        );
      },

      snoozeEmail: (emailId, snoozedUntil, reminder) => {
        const entry: SnoozedEmail = {
          emailId,
          snoozedUntil,
          reminder,
          snoozedAt: new Date().toISOString(),
        };
        set((state) => ({
          snoozedEmails: [
            ...state.snoozedEmails.filter((s) => s.emailId !== emailId),
            entry,
          ],
        }));
      },

      unsnoozeEmail: (emailId) => {
        set((state) => ({
          snoozedEmails: state.snoozedEmails.filter((s) => s.emailId !== emailId),
        }));
      },

      setDefaultReminders: (reminders) => set({ defaultReminders: reminders }),

      clearDueSnoozes: () => {
        const now = Date.now();
        set((state) => ({
          snoozedEmails: state.snoozedEmails.filter(
            (s) => new Date(s.snoozedUntil).getTime() > now,
          ),
        }));
      },
    }),
    {
      name: "misfits-snooze",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        snoozedEmails: state.snoozedEmails,
        defaultReminders: state.defaultReminders,
      }),
    },
  ),
);

/** Format an ISO snooze timestamp for display. */
export function formatSnoozeUntil(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
