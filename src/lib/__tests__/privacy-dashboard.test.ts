/**
 * Unit tests for privacy dashboard.
 */
import { describe, it, expect } from "vitest";
import {
  getDataOverview,
  formatStorageSize,
  createActivityLogEntry,
  getRecentActivity,
  filterActivityByAction,
  createThirdPartyApp,
  revokeAppAccess,
  appHasPermission,
  getDefaultPrivacySettings,
  updatePrivacySettings,
  validateDeleteConfirmation,
  createDeleteAccountResult,
  exportUserData,
  getPrivacySettingDescription,
  isGDPRCompliant,
} from "@/lib/privacy-dashboard";

describe("privacy-dashboard", () => {
  describe("getDataOverview", () => {
    it("returns data overview", () => {
      const overview = getDataOverview({
        storageUsed: 1024,
        emailCount: 100,
        contactCount: 50,
        calendarEventCount: 10,
        lastActivity: "2026-09-10T12:00:00Z",
      });
      expect(overview.storageUsed).toBe(1024);
      expect(overview.emailCount).toBe(100);
    });
  });

  describe("formatStorageSize", () => {
    it("formats bytes", () => {
      expect(formatStorageSize(0)).toBe("0 B");
      expect(formatStorageSize(1024)).toBe("1.0 KB");
      expect(formatStorageSize(1048576)).toBe("1.0 MB");
    });
  });

  describe("createActivityLogEntry", () => {
    it("creates log entry", () => {
      const entry = createActivityLogEntry({
        action: "login",
        ip: "192.168.1.1",
        details: "Web login",
      });
      expect(entry.action).toBe("login");
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe("getRecentActivity", () => {
    it("returns recent entries", () => {
      const entries = [
        createActivityLogEntry({ action: "login" }),
        createActivityLogEntry({ action: "logout" }),
        createActivityLogEntry({ action: "export" }),
      ];
      const recent = getRecentActivity(entries, 2);
      expect(recent).toHaveLength(2);
    });
  });

  describe("filterActivityByAction", () => {
    it("filters by action", () => {
      const entries = [
        createActivityLogEntry({ action: "login" }),
        createActivityLogEntry({ action: "logout" }),
        createActivityLogEntry({ action: "login" }),
      ];
      const filtered = filterActivityByAction(entries, "login");
      expect(filtered).toHaveLength(2);
    });
  });

  describe("createThirdPartyApp", () => {
    it("creates app entry", () => {
      const app = createThirdPartyApp({
        name: "Test App",
        permissions: ["read", "write"],
        lastUsed: "2026-09-10T12:00:00Z",
        connectedAt: "2026-09-01T12:00:00Z",
      });
      expect(app.name).toBe("Test App");
      expect(app.permissions).toContain("read");
    });
  });

  describe("revokeAppAccess", () => {
    it("removes app", () => {
      const apps = [
        createThirdPartyApp({ name: "App1", permissions: [], lastUsed: "", connectedAt: "" }),
        createThirdPartyApp({ name: "App2", permissions: [], lastUsed: "", connectedAt: "" }),
      ];
      const result = revokeAppAccess(apps, apps[0].id);
      expect(result).toHaveLength(1);
    });
  });

  describe("appHasPermission", () => {
    it("returns true for existing permission", () => {
      const app = createThirdPartyApp({ name: "Test", permissions: ["read"], lastUsed: "", connectedAt: "" });
      expect(appHasPermission(app, "read")).toBe(true);
    });

    it("returns false for missing permission", () => {
      const app = createThirdPartyApp({ name: "Test", permissions: ["read"], lastUsed: "", connectedAt: "" });
      expect(appHasPermission(app, "write")).toBe(false);
    });
  });

  describe("getDefaultPrivacySettings", () => {
    it("returns defaults", () => {
      const settings = getDefaultPrivacySettings();
      expect(settings.dataCollection).toBe(true);
      expect(settings.analytics).toBe(false);
    });
  });

  describe("updatePrivacySettings", () => {
    it("updates settings", () => {
      const settings = getDefaultPrivacySettings();
      const updated = updatePrivacySettings(settings, { analytics: true });
      expect(updated.analytics).toBe(true);
    });
  });

  describe("validateDeleteConfirmation", () => {
    it("validates correct input", () => {
      expect(validateDeleteConfirmation("DELETE")).toBe(true);
    });

    it("rejects incorrect input", () => {
      expect(validateDeleteConfirmation("delete")).toBe(true);
      expect(validateDeleteConfirmation("yes")).toBe(false);
    });
  });

  describe("createDeleteAccountResult", () => {
    it("requires confirmation", () => {
      const result = createDeleteAccountResult(false);
      expect(result.success).toBe(false);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("succeeds with confirmation", () => {
      const result = createDeleteAccountResult(true);
      expect(result.success).toBe(true);
    });
  });

  describe("exportUserData", () => {
    it("exports as JSON", () => {
      const json = exportUserData({
        emails: [],
        contacts: [],
        calendarEvents: [],
        settings: getDefaultPrivacySettings(),
        activityLog: [],
      });
      const parsed = JSON.parse(json);
      expect(parsed.exportedAt).toBeDefined();
    });
  });

  describe("getPrivacySettingDescription", () => {
    it("returns descriptions", () => {
      expect(getPrivacySettingDescription("dataCollection")).toContain("usage data");
      expect(getPrivacySettingDescription("analytics")).toContain("analytics");
    });
  });

  describe("isGDPRCompliant", () => {
    it("returns true for compliant settings", () => {
      const settings = getDefaultPrivacySettings();
      expect(isGDPRCompliant(settings)).toBe(true);
    });

    it("returns false for non-compliant", () => {
      const settings = getDefaultPrivacySettings();
      settings.thirdPartySharing = true;
      expect(isGDPRCompliant(settings)).toBe(false);
    });
  });
});
