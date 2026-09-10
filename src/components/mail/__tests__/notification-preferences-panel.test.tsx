import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationPreferencesPanel } from "@/components/mail/notification-preferences-panel";
import { useNotificationPreferences } from "@/stores/notification-preferences";

vi.mock("@/stores/email-store", () => ({
  useEmailStore: (selector: (state: { folders: unknown[] }) => unknown) =>
    selector({ folders: [
      { id: "inbox", name: "Inbox", unreadCount: 5 },
      { id: "sent", name: "Sent", unreadCount: 0 },
      { id: "archive", name: "Archive", unreadCount: 0 },
    ] }),
}));

describe("NotificationPreferencesPanel", () => {
  beforeEach(() => {
    useNotificationPreferences.setState({
      prefs: {
        enabled: false, browserPermission: "default", quietHoursEnabled: false,
        quietHoursStart: "22:00", quietHoursEnd: "07:00", vipOnly: false, sound: "chime",
        folderPrefs: { inbox: true, sent: false, drafts: false, archive: false, trash: false, spam: false },
      },
      hydrated: true,
    });
  });

  it("renders the panel", () => {
    render(<NotificationPreferencesPanel />);
    expect(screen.getByTestId("notification-preferences-panel")).toBeTruthy();
  });

  it("shows master toggle", () => {
    render(<NotificationPreferencesPanel />);
    expect(screen.getByTestId("notification-master-toggle")).toBeTruthy();
  });

  it("shows quiet hours toggle", () => {
    render(<NotificationPreferencesPanel />);
    expect(screen.getByTestId("quiet-hours-toggle")).toBeTruthy();
  });

  it("shows VIP-only toggle", () => {
    render(<NotificationPreferencesPanel />);
    expect(screen.getByTestId("vip-only-toggle")).toBeTruthy();
  });

  it("shows per-folder toggles", () => {
    render(<NotificationPreferencesPanel />);
    expect(screen.getByTestId("folder-toggle-inbox")).toBeTruthy();
    expect(screen.getByTestId("folder-toggle-sent")).toBeTruthy();
    expect(screen.getByTestId("folder-toggle-archive")).toBeTruthy();
  });

  it("shows sound options", () => {
    render(<NotificationPreferencesPanel />);
    expect(screen.getByTestId("sound-option-chime")).toBeTruthy();
    expect(screen.getByTestId("sound-option-bell")).toBeTruthy();
    expect(screen.getByTestId("sound-option-pop")).toBeTruthy();
    expect(screen.getByTestId("sound-option-none")).toBeTruthy();
  });

  it("shows notification preview", () => {
    render(<NotificationPreferencesPanel />);
    expect(screen.getByText("Notification preview")).toBeTruthy();
    expect(screen.getByText("New email from John Doe")).toBeTruthy();
  });

  it("shows quiet hours time inputs when enabled", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, quietHoursEnabled: true } });
    render(<NotificationPreferencesPanel />);
    expect(screen.getByTestId("quiet-hours-start")).toBeTruthy();
    expect(screen.getByTestId("quiet-hours-end")).toBeTruthy();
  });

  it("shows browser permission denied message when denied", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, browserPermission: "denied" } });
    render(<NotificationPreferencesPanel />);
    expect(screen.getByText(/Notifications are blocked/)).toBeTruthy();
  });

  it("toggles quiet hours", () => {
    render(<NotificationPreferencesPanel />);
    fireEvent.click(screen.getByTestId("quiet-hours-toggle"));
    expect(useNotificationPreferences.getState().prefs.quietHoursEnabled).toBe(true);
  });

  it("toggles VIP-only mode", () => {
    render(<NotificationPreferencesPanel />);
    fireEvent.click(screen.getByTestId("vip-only-toggle"));
    expect(useNotificationPreferences.getState().prefs.vipOnly).toBe(true);
  });

  it("toggles per-folder notification", () => {
    render(<NotificationPreferencesPanel />);
    fireEvent.click(screen.getByTestId("folder-toggle-sent"));
    expect(useNotificationPreferences.getState().prefs.folderPrefs.sent).toBe(true);
  });

  it("changes sound option", () => {
    render(<NotificationPreferencesPanel />);
    fireEvent.click(screen.getByTestId("sound-option-bell"));
    expect(useNotificationPreferences.getState().prefs.sound).toBe("bell");
  });
});
