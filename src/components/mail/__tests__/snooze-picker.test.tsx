import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnoozePicker } from "@/components/mail/snooze-picker";
import { useSnoozeStore, SNOOZE_PRESETS } from "@/stores/snooze-store";
import { useEmailStore } from "@/stores/email-store";
import type { Email } from "@/types/email";

const mockEmail: Email = {
  id: "test-1",
  threadId: "thread-1",
  folder: "inbox",
  from: { name: "Alice", address: "alice@example.com" },
  to: [{ name: "Me", address: "me@example.com" }],
  subject: "Test subject",
  preview: "Test preview",
  body: "<p>Test body</p>",
  bodyType: "html",
  date: new Date().toISOString(),
  receivedAt: new Date().toISOString(),
  isRead: false,
  isStarred: false,
  isImportant: false,
  hasAttachments: false,
  attachments: [],
  labels: [],
  size: 1024,
  messageId: "msg-1",
};

describe("SnoozePicker", () => {
  beforeEach(() => {
    useSnoozeStore.setState({ snoozedEmails: [] });
    useEmailStore.setState({ emails: [mockEmail] });
    localStorage.clear();
  });

  it("renders the snooze trigger button", () => {
    render(<SnoozePicker emailId="test-1" />);
    expect(screen.getByTestId("snooze-trigger")).toBeInTheDocument();
  });

  it("opens the popover when clicked", () => {
    render(<SnoozePicker emailId="test-1" />);
    fireEvent.click(screen.getByTestId("snooze-trigger"));
    expect(screen.getByTestId("snooze-popover")).toBeInTheDocument();
  });

  it("shows all preset options", () => {
    render(<SnoozePicker emailId="test-1" />);
    fireEvent.click(screen.getByTestId("snooze-trigger"));

    SNOOZE_PRESETS.forEach((preset) => {
      expect(screen.getByTestId(`snooze-preset-${preset.id}`)).toBeInTheDocument();
    });
  });

  it("snoozes an email when a preset is clicked", () => {
    render(<SnoozePicker emailId="test-1" />);
    fireEvent.click(screen.getByTestId("snooze-trigger"));

    const presetBtn = screen.getByTestId("snooze-preset-tomorrow-morning");
    fireEvent.click(presetBtn);

    const state = useSnoozeStore.getState();
    expect(state.snoozedEmails).toHaveLength(1);
    expect(state.snoozedEmails[0].emailId).toBe("test-1");
  });

  it("shows custom date/time picker when toggled", () => {
    render(<SnoozePicker emailId="test-1" />);
    fireEvent.click(screen.getByTestId("snooze-trigger"));

    fireEvent.click(screen.getByTestId("snooze-custom-toggle"));
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Time")).toBeInTheDocument();
  });

  it("snoozes with custom date when confirmed", () => {
    render(<SnoozePicker emailId="test-1" />);
    fireEvent.click(screen.getByTestId("snooze-trigger"));

    fireEvent.click(screen.getByTestId("snooze-custom-toggle"));

    const dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-12-25" } });

    const timeInput = screen.getByLabelText("Time") as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: "14:30" } });

    fireEvent.click(screen.getByTestId("snooze-custom-confirm"));

    const state = useSnoozeStore.getState();
    expect(state.snoozedEmails).toHaveLength(1);
    expect(state.snoozedEmails[0].snoozedUntil).toContain("2026-12-25");
  });

  it("shows snoozed list in manager mode (no emailId)", () => {
    // Pre-populate a snooze
    useSnoozeStore.getState().snoozeEmail("test-1", "2026-09-15T09:00:00.000Z");

    render(<SnoozePicker />);
    fireEvent.click(screen.getByTestId("snooze-trigger"));

    expect(screen.getByText("Test subject")).toBeInTheDocument();
  });

  it("un-snoozes when X button is clicked in manager mode", () => {
    useSnoozeStore.getState().snoozeEmail("test-1", "2026-09-15T09:00:00.000Z");

    render(<SnoozePicker />);
    fireEvent.click(screen.getByTestId("snooze-trigger"));

    const unsoBtn = screen.getByLabelText("Un-snooze");
    fireEvent.click(unsoBtn);

    const state = useSnoozeStore.getState();
    expect(state.snoozedEmails).toHaveLength(0);
  });
});
