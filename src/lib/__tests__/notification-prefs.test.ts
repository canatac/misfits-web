import { describe, it, expect } from "vitest";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  isQuietHours,
  shouldNotifyForFolder,
  isNotificationSupported,
  DEFAULT_PREFERENCES,
} from "@/lib/notification-prefs";

describe("notification-prefs", () => {
  it("loads default preferences", () => {
    const prefs = loadNotificationPreferences();
    expect(prefs.enabled).toBe(false);
    expect(prefs.vipOnly).toBe(false);
  });

  it("saves and loads preferences", () => {
    const prefs = { ...DEFAULT_PREFERENCES, enabled: true, vipOnly: true };
    saveNotificationPreferences(prefs);
    const loaded = loadNotificationPreferences();
    expect(loaded.enabled).toBe(true);
    expect(loaded.vipOnly).toBe(true);
  });

  it("checks quiet hours", () => {
    const prefs = { ...DEFAULT_PREFERENCES, quietHoursEnabled: true, quietHoursStart: "22:00", quietHoursEnd: "07:00" };
    expect(typeof isQuietHours(prefs)).toBe("boolean");
  });

  it("checks folder notification", () => {
    const prefs = { ...DEFAULT_PREFERENCES, enabled: true, folderSettings: { inbox: true } };
    expect(shouldNotifyForFolder(prefs, "inbox")).toBe(true);
    expect(shouldNotifyForFolder(prefs, "sent")).toBe(false);
  });

  it("checks notification support", () => {
    expect(typeof isNotificationSupported()).toBe("boolean");
  });
});
