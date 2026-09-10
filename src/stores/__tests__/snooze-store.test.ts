import { describe, it, expect, beforeEach } from "vitest";
import { useSnoozeStore, SNOOZE_PRESETS } from "@/stores/snooze-store";

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
    expect(useSnoozeStore.getState().snoozedEmails).toHaveLength(0);
  });

  it("checks if an email is snoozed", () => {
    const { snoozeEmail } = useSnoozeStore.getState();
    snoozeEmail("email-1", "2026-09-11T09:00:00.000Z");
    expect(useSnoozeStore.getState().isSnoozed("email-1")).toBe(true);
    expect(useSnoozeStore.getState().isSnoozed("email-2")).toBe(false);
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
});
