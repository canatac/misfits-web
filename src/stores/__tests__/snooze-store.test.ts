import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSnoozeStore, SNOOZE_PRESETS, formatSnoozeUntil } from "@/stores/snooze-store";

describe("snooze-store", () => {
  beforeEach(() => {
    useSnoozeStore.setState({ snoozedEmails: [] });
    localStorage.clear();
  });

  it("snoozes an email with a given ISO timestamp", () => {
    const { snoozeEmail } = useSnoozeStore.getState();
    snoozeEmail("email-1", "2026-09-11T09:00:00.000Z");

    const state = useSnoozeStore.getState();
    expect(state.snoozedEmails).toHaveLength(1);
    expect(state.snoozedEmails[0].emailId).toBe("email-1");
    expect(state.snoozedEmails[0].snoozedUntil).toBe("2026-09-11T09:00:00.000Z");
  });

  it("replaces existing snooze for same email", () => {
    const { snoozeEmail } = useSnoozeStore.getState();
    snoozeEmail("email-1", "2026-09-11T09:00:00.000Z");
    snoozeEmail("email-1", "2026-09-12T09:00:00.000Z");

    const state = useSnoozeStore.getState();
    expect(state.snoozedEmails).toHaveLength(1);
    expect(state.snoozedEmails[0].snoozedUntil).toBe("2026-09-12T09:00:00.000Z");
  });

  it("unsnoozes an email", () => {
    const { snoozeEmail, unsnoozeEmail } = useSnoozeStore.getState();
    snoozeEmail("email-1", "2026-09-11T09:00:00.000Z");
    unsnoozeEmail("email-1");

    const state = useSnoozeStore.getState();
    expect(state.snoozedEmails).toHaveLength(0);
  });

  it("checks if an email is snoozed", () => {
    const { snoozeEmail } = useSnoozeStore.getState();
    snoozeEmail("email-1", "2026-09-11T09:00:00.000Z");

    expect(useSnoozeStore.getState().isSnoozed("email-1")).toBe(true);
    expect(useSnoozeStore.getState().isSnoozed("email-2")).toBe(false);
  });

  it("returns snoozed emails sorted by until date", () => {
    const { snoozeEmail } = useSnoozeStore.getState();
    snoozeEmail("email-2", "2026-09-15T09:00:00.000Z");
    snoozeEmail("email-1", "2026-09-11T09:00:00.000Z");

    const sorted = useSnoozeStore.getState().getSnoozedEmails();
    expect(sorted[0].emailId).toBe("email-1");
    expect(sorted[1].emailId).toBe("email-2");
  });

  it("checks due reminders", () => {
    const { snoozeEmail } = useSnoozeStore.getState();
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();

    snoozeEmail("email-past", past);
    snoozeEmail("email-future", future);

    const due = useSnoozeStore.getState().checkDueReminders();
    expect(due).toHaveLength(1);
    expect(due[0].emailId).toBe("email-past");
  });

  it("clears due snoozes", () => {
    const { snoozeEmail, clearDueSnoozes } = useSnoozeStore.getState();
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();

    snoozeEmail("email-past", past);
    snoozeEmail("email-future", future);
    clearDueSnoozes();

    const state = useSnoozeStore.getState();
    expect(state.snoozedEmails).toHaveLength(1);
    expect(state.snoozedEmails[0].emailId).toBe("email-future");
  });
});

describe("SNOOZE_PRESETS", () => {
  it("has 5 presets", () => {
    expect(SNOOZE_PRESETS).toHaveLength(5);
  });

  it("includes later-today, tomorrow-morning, tonight, this-weekend, next-week", () => {
    const ids = SNOOZE_PRESETS.map((p) => p.id);
    expect(ids).toContain("later-today");
    expect(ids).toContain("tomorrow-morning");
    expect(ids).toContain("tonight");
    expect(ids).toContain("this-weekend");
    expect(ids).toContain("next-week");
  });

  it("each preset returns a valid ISO string", () => {
    SNOOZE_PRESETS.forEach((preset) => {
      const iso = preset.getUntil();
      expect(new Date(iso).getTime()).not.toBeNaN();
    });
  });
});

describe("formatSnoozeUntil", () => {
  it("formats an ISO timestamp to a readable string", () => {
    const formatted = formatSnoozeUntil("2026-09-11T09:00:00.000Z");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});
