/**
 * Unit tests for PWA offline mode utilities.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  isOnline,
  getOnlineStatus,
  addPendingAction,
  getPendingActions,
  removePendingAction,
  clearPendingActions,
  incrementRetryCount,
  cacheEmails,
  getCachedEmails,
  getLastSyncTime,
  clearOfflineCache,
  isOfflineModeAvailable,
  getOfflineStatusText,
  getOfflineStatusColor,
  canPerformOffline,
  getPendingActionsCount,
  hasPendingActions,
} from "@/lib/pwa-offline";

describe("pwa-offline", () => {
  beforeEach(() => {
    clearPendingActions();
    clearOfflineCache();
  });

  describe("getOnlineStatus", () => {
    it("returns a valid status", () => {
      const status = getOnlineStatus();
      expect(["online", "offline", "unknown"]).toContain(status);
    });
  });

  describe("addPendingAction", () => {
    it("adds action to queue", () => {
      const action = addPendingAction({
        type: "delete",
        payload: { emailId: "e1" },
      });
      expect(action.id).toBeDefined();
      expect(action.timestamp).toBeDefined();
      expect(action.retryCount).toBe(0);
    });
  });

  describe("getPendingActions", () => {
    it("returns empty array initially", () => {
      expect(getPendingActions()).toHaveLength(0);
    });

    it("returns added actions", () => {
      addPendingAction({ type: "delete", payload: {} });
      addPendingAction({ type: "archive", payload: {} });
      expect(getPendingActions()).toHaveLength(2);
    });
  });

  describe("removePendingAction", () => {
    it("removes action by id", () => {
      const action = addPendingAction({ type: "delete", payload: {} });
      removePendingAction(action.id);
      expect(getPendingActions()).toHaveLength(0);
    });
  });

  describe("clearPendingActions", () => {
    it("clears all actions", () => {
      addPendingAction({ type: "delete", payload: {} });
      addPendingAction({ type: "archive", payload: {} });
      clearPendingActions();
      expect(getPendingActions()).toHaveLength(0);
    });
  });

  describe("incrementRetryCount", () => {
    it("increments retry count", () => {
      const action = addPendingAction({ type: "delete", payload: {} });
      incrementRetryCount(action.id);
      const actions = getPendingActions();
      expect(actions[0].retryCount).toBe(1);
    });
  });

  describe("cacheEmails", () => {
    it("caches emails", () => {
      const emails = [
        { id: "e1", subject: "Test", from: "test@example.com", preview: "Preview", date: "2026-09-10", cachedAt: new Date().toISOString() },
      ];
      cacheEmails(emails);
      expect(getCachedEmails()).toHaveLength(1);
    });

    it("respects max emails limit", () => {
      const emails = Array.from({ length: 150 }, (_, i) => ({
        id: `e${i}`,
        subject: `Test ${i}`,
        from: "test@example.com",
        preview: "Preview",
        date: "2026-09-10",
        cachedAt: new Date().toISOString(),
      }));
      cacheEmails(emails, 100);
      expect(getCachedEmails()).toHaveLength(100);
    });
  });

  describe("getCachedEmails", () => {
    it("returns empty array when no cache", () => {
      expect(getCachedEmails()).toHaveLength(0);
    });
  });

  describe("getLastSyncTime", () => {
    it("returns null when no cache", () => {
      expect(getLastSyncTime()).toBeNull();
    });

    it("returns timestamp after caching", () => {
      cacheEmails([]);
      expect(getLastSyncTime()).toBeDefined();
    });
  });

  describe("clearOfflineCache", () => {
    it("clears cache", () => {
      cacheEmails([]);
      clearOfflineCache();
      expect(getCachedEmails()).toHaveLength(0);
    });
  });

  describe("isOfflineModeAvailable", () => {
    it("returns false when no cached emails", () => {
      expect(isOfflineModeAvailable()).toBe(false);
    });

    it("returns true when emails cached", () => {
      cacheEmails([{ id: "e1", subject: "Test", from: "test@example.com", preview: "Preview", date: "2026-09-10", cachedAt: new Date().toISOString() }]);
      expect(isOfflineModeAvailable()).toBe(true);
    });
  });

  describe("getOfflineStatusText", () => {
    it("returns correct text", () => {
      expect(getOfflineStatusText("online")).toBe("Online");
      expect(getOfflineStatusText("offline")).toBe("Offline");
      expect(getOfflineStatusText("unknown")).toBe("Unknown");
    });
  });

  describe("getOfflineStatusColor", () => {
    it("returns correct colors", () => {
      expect(getOfflineStatusColor("online")).toBe("text-green-500");
      expect(getOfflineStatusColor("offline")).toBe("text-red-500");
      expect(getOfflineStatusColor("unknown")).toBe("text-gray-500");
    });
  });

  describe("canPerformOffline", () => {
    it("returns true for offline-capable actions", () => {
      expect(canPerformOffline("delete")).toBe(true);
      expect(canPerformOffline("archive")).toBe(true);
      expect(canPerformOffline("markRead")).toBe(true);
      expect(canPerformOffline("star")).toBe(true);
    });

    it("returns false for send", () => {
      expect(canPerformOffline("send")).toBe(false);
    });
  });

  describe("getPendingActionsCount", () => {
    it("returns 0 initially", () => {
      expect(getPendingActionsCount()).toBe(0);
    });

    it("returns correct count", () => {
      addPendingAction({ type: "delete", payload: {} });
      addPendingAction({ type: "archive", payload: {} });
      expect(getPendingActionsCount()).toBe(2);
    });
  });

  describe("hasPendingActions", () => {
    it("returns false initially", () => {
      expect(hasPendingActions()).toBe(false);
    });

    it("returns true when actions exist", () => {
      addPendingAction({ type: "delete", payload: {} });
      expect(hasPendingActions()).toBe(true);
    });
  });
});
