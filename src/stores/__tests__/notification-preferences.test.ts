import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useNotificationPreferences } from "@/stores/notification-preferences";

describe("notification-preferences store", () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationPreferences.setState({
      prefs: {
        enabled: false,
        browserPermission: "default",
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        vipOnly: false,
        sound: "chime",
        folderPrefs: { inbox: true, sent: false, drafts: false, archive: false, trash: false, spam: false },
      },
      hydrated: false,
    });
  });

  afterEach(() => { localStorage.clear(); });

  it("has correct defaults", () => {
    const { prefs } = useNotificationPreferences.getState();
    expect(prefs.enabled).toBe(false);
    expect(prefs.browserPermission).toBe("default");
    expect(prefs.quietHoursEnabled).toBe(false);
    expect(prefs.quietHoursStart).toBe("22:00");
    expect(prefs.quietHoursEnd).toBe("07:00");
    expect(prefs.vipOnly).toBe(false);
    expect(prefs.sound).toBe("chime");
    expect(prefs.folderPrefs.inbox).toBe(true);
    expect(prefs.folderPrefs.sent).toBe(false);
  });

  it("updates prefs", () => {
    useNotificationPreferences.getState().updatePrefs({ vipOnly: true, sound: "bell" });
    const { prefs } = useNotificationPreferences.getState();
    expect(prefs.vipOnly).toBe(true);
    expect(prefs.sound).toBe("bell");
  });

  it("sets folder pref", () => {
    useNotificationPreferences.getState().setFolderPref("sent", true);
    expect(useNotificationPreferences.getState().prefs.folderPrefs.sent).toBe(true);
    useNotificationPreferences.getState().setFolderPref("sent", false);
    expect(useNotificationPreferences.getState().prefs.folderPrefs.sent).toBe(false);
  });

  it("isInQuietHours returns false when disabled", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, quietHoursEnabled: false } });
    expect(useNotificationPreferences.getState().isInQuietHours()).toBe(false);
  });

  it("isInQuietHours returns true when current time is within range", () => {
    const mockDate = new Date();
    mockDate.setHours(23, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    useNotificationPreferences.setState({
      prefs: { ...useNotificationPreferences.getState().prefs, quietHoursEnabled: true, quietHoursStart: "22:00", quietHoursEnd: "07:00" },
    });
    expect(useNotificationPreferences.getState().isInQuietHours()).toBe(true);
    vi.useRealTimers();
  });

  it("shouldNotifyForEmail returns false when disabled", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, enabled: false } });
    expect(useNotificationPreferences.getState().shouldNotifyForEmail({ folder: "inbox", isStarred: true })).toBe(false);
  });

  it("shouldNotifyForEmail returns true for inbox when enabled", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, enabled: true } });
    expect(useNotificationPreferences.getState().shouldNotifyForEmail({ folder: "inbox", isStarred: false })).toBe(true);
  });

  it("shouldNotifyForEmail respects vip-only mode", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, enabled: true, vipOnly: true } });
    expect(useNotificationPreferences.getState().shouldNotifyForEmail({ folder: "inbox", isStarred: false })).toBe(false);
    expect(useNotificationPreferences.getState().shouldNotifyForEmail({ folder: "inbox", isStarred: true })).toBe(true);
  });

  it("shouldNotifyForEmail respects per-folder toggle", () => {
    useNotificationPreferences.setState({ prefs: { ...useNotificationPreferences.getState().prefs, enabled: true } });
    expect(useNotificationPreferences.getState().shouldNotifyForEmail({ folder: "sent", isStarred: false })).toBe(false);
    useNotificationPreferences.getState().setFolderPref("sent", true);
    expect(useNotificationPreferences.getState().shouldNotifyForEmail({ folder: "sent", isStarred: false })).toBe(true);
  });

  it("persists prefs to localStorage", () => {
    useNotificationPreferences.getState().updatePrefs({ vipOnly: true });
    const stored = localStorage.getItem("misfits-notification-prefs");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.prefs.vipOnly).toBe(true);
  });
});
