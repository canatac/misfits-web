/**
 * Unit tests for mute thread utility.
 */
import { describe, it, expect } from "vitest";
import {
  muteThread,
  unmutedThread,
  isThreadMuted,
  getMuteStatus,
  getMutedThreads,
  getExpiredMutes,
  cleanupExpiredMutes,
  parseDurationToHours,
  formatMuteDuration,
  getRemainingMuteHours,
  isPermanentMute,
  getMuteReason,
} from "@/lib/mute-thread";

describe("mute-thread", () => {
  describe("muteThread", () => {
    it("creates permanent mute", () => {
      const muted = muteThread("t1", "permanent");
      expect(muted.threadId).toBe("t1");
      expect(muted.expiresAt).toBeNull();
      expect(muted.duration).toBe("permanent");
    });

    it("creates temporary mute", () => {
      const muted = muteThread("t1", "24h");
      expect(muted.expiresAt).toBeDefined();
      expect(muted.duration).toBe("24h");
    });
  });

  describe("unmutedThread", () => {
    it("unmutes thread", () => {
      const muted = muteThread("t1", "permanent");
      const unmuted = unmutedThread(muted);
      expect(unmuted.expiresAt).toBeDefined();
    });
  });

  describe("isThreadMuted", () => {
    it("returns true for muted thread", () => {
      const muted = [muteThread("t1", "permanent")];
      expect(isThreadMuted(muted, "t1")).toBe(true);
    });

    it("returns false for unmuted thread", () => {
      const muted: any[] = [];
      expect(isThreadMuted(muted, "t1")).toBe(false);
    });

    it("returns false for expired mute", () => {
      const muted = muteThread("t1", "permanent");
      muted.expiresAt = new Date(Date.now() - 1000).toISOString();
      expect(isThreadMuted([muted], "t1")).toBe(false);
    });
  });

  describe("getMuteStatus", () => {
    it("returns muted status", () => {
      const muted = [muteThread("t1", "permanent")];
      const status = getMuteStatus(muted, "t1");
      expect(status.muted).toBe(true);
      expect(status.duration).toBe("permanent");
    });

    it("returns unmuted status", () => {
      const muted: any[] = [];
      const status = getMuteStatus(muted, "t1");
      expect(status.muted).toBe(false);
    });
  });

  describe("getMutedThreads", () => {
    it("returns only active mutes", () => {
      const muted = [
        muteThread("t1", "permanent"),
        muteThread("t2", "24h"),
      ];
      muted[1].expiresAt = new Date(Date.now() - 1000).toISOString();
      const active = getMutedThreads(muted);
      expect(active).toHaveLength(1);
    });
  });

  describe("getExpiredMutes", () => {
    it("returns expired mutes", () => {
      const muted = [
        muteThread("t1", "permanent"),
        muteThread("t2", "24h"),
      ];
      muted[1].expiresAt = new Date(Date.now() - 1000).toISOString();
      const expired = getExpiredMutes(muted);
      expect(expired).toHaveLength(1);
    });
  });

  describe("cleanupExpiredMutes", () => {
    it("removes expired mutes", () => {
      const muted = [
        muteThread("t1", "permanent"),
        muteThread("t2", "24h"),
      ];
      muted[1].expiresAt = new Date(Date.now() - 1000).toISOString();
      const cleaned = cleanupExpiredMutes(muted);
      expect(cleaned).toHaveLength(1);
    });
  });

  describe("parseDurationToHours", () => {
    it("returns correct hours", () => {
      expect(parseDurationToHours("1h")).toBe(1);
      expect(parseDurationToHours("8h")).toBe(8);
      expect(parseDurationToHours("24h")).toBe(24);
      expect(parseDurationToHours("7d")).toBe(168);
      expect(parseDurationToHours("30d")).toBe(720);
      expect(parseDurationToHours("permanent")).toBe(0);
    });
  });

  describe("formatMuteDuration", () => {
    it("returns correct labels", () => {
      expect(formatMuteDuration("permanent")).toBe("Permanently muted");
      expect(formatMuteDuration("1h")).toBe("Muted for 1 hour");
    });
  });

  describe("getRemainingMuteHours", () => {
    it("returns infinity for permanent", () => {
      const muted = muteThread("t1", "permanent");
      expect(getRemainingMuteHours(muted)).toBe(Infinity);
    });

    it("returns hours for temporary", () => {
      const muted = muteThread("t1", "24h");
      const hours = getRemainingMuteHours(muted);
      expect(hours).toBeGreaterThan(23);
      expect(hours).toBeLessThanOrEqual(24);
    });
  });

  describe("isPermanentMute", () => {
    it("returns true for permanent", () => {
      const muted = muteThread("t1", "permanent");
      expect(isPermanentMute(muted)).toBe(true);
    });

    it("returns false for temporary", () => {
      const muted = muteThread("t1", "24h");
      expect(isPermanentMute(muted)).toBe(false);
    });
  });

  describe("getMuteReason", () => {
    it("returns custom reason", () => {
      const muted = muteThread("t1", "permanent", "Too noisy");
      expect(getMuteReason(muted)).toBe("Too noisy");
    });

    it("returns default for permanent", () => {
      const muted = muteThread("t1", "permanent");
      expect(getMuteReason(muted)).toBe("No reason given");
    });
  });
});
