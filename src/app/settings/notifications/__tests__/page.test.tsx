import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NotificationsSettingsPage from "@/app/settings/notifications/page";

vi.mock("@/components/mail/notification-preferences-panel", () => ({
  NotificationPreferencesPanel: () => <div data-testid="mock-panel">Notification Preferences</div>,
}));

describe("NotificationsSettingsPage", () => {
  it("renders the page heading", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByText("Notifications")).toBeTruthy();
  });

  it("renders the preferences panel", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByTestId("mock-panel")).toBeTruthy();
  });

  it("shows description text", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByText("Manage desktop notifications and quiet hours.")).toBeTruthy();
  });
});
