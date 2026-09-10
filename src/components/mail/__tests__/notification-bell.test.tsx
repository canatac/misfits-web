import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationBell } from "@/components/mail/notification-bell";
import { useNotificationPreferences } from "@/stores/notification-preferences";

describe("NotificationBell", () => {
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

  it("renders the bell icon", () => {
    render(<NotificationBell />);
    expect(screen.getByTestId("notification-bell")).toBeTruthy();
  });

  it("shows disabled state when notifications are off", () => {
    render(<NotificationBell />);
    expect(screen.getByTestId("notification-bell").getAttribute("data-enabled")).toBe("false");
  });

  it("shows enabled state when notifications are on", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, enabled: true } });
    render(<NotificationBell />);
    expect(screen.getByTestId("notification-bell").getAttribute("data-enabled")).toBe("true");
  });

  it("calls onClick when provided", () => {
    const onClick = vi.fn();
    render(<NotificationBell onClick={onClick} />);
    fireEvent.click(screen.getByTestId("notification-bell"));
    expect(onClick).toHaveBeenCalled();
  });
});
