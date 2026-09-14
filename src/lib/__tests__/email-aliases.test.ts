/**
 * Unit tests for masked email aliases utility.
 */
import { describe, it, expect } from "vitest";
import {
  generateAliasString,
  createAlias,
  disableAlias,
  enableAlias,
  isAliasActive,
  recordAliasReceived,
  recordAliasForwarded,
  getActiveAliases,
  getDisabledAliases,
  findAliasByEmail,
  computeAliasStats,
  canCreateAlias,
  getRemainingAliases,
  isValidAliasFormat,
  getAliasDomain,
  ALIAS_LIMITS,
} from "@/lib/email-aliases";
import type { EmailAlias } from "@/lib/email-aliases";

function makeAlias(overrides: Partial<EmailAlias> = {}): EmailAlias {
  return {
    id: "alias-1",
    alias: "abc123@misfits.ai",
    isActive: true,
    createdAt: "2026-09-10T12:00:00Z",
    stats: { received: 0, forwarded: 0, lastActivity: null },
    ...overrides,
  };
}

describe("email-aliases", () => {
  describe("generateAliasString", () => {
    it("generates string of specified length", () => {
      expect(generateAliasString(8)).toHaveLength(8);
    });

    it("generates only lowercase and digits", () => {
      const alias = generateAliasString();
      expect(alias).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe("createAlias", () => {
    it("creates alias successfully", () => {
      const result = createAlias({ currentUserAliases: [] });
      expect(result.success).toBe(true);
      expect(result.alias).toBeDefined();
      expect(result.alias?.alias).toContain("@misfits.ai");
    });

    it("fails when free tier limit reached", () => {
      const aliases = Array.from({ length: 10 }, (_, i) => makeAlias({ id: `alias-${i}` }));
      const result = createAlias({ currentUserAliases: aliases, tier: "free" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("limit");
    });

    it("allows unlimited for pro tier", () => {
      const aliases = Array.from({ length: 100 }, (_, i) => makeAlias({ id: `alias-${i}` }));
      const result = createAlias({ currentUserAliases: aliases, tier: "pro" });
      expect(result.success).toBe(true);
    });
  });

  describe("disableAlias", () => {
    it("disables active alias", () => {
      const alias = makeAlias();
      const disabled = disableAlias(alias);
      expect(disabled.isActive).toBe(false);
    });
  });

  describe("enableAlias", () => {
    it("enables disabled alias", () => {
      const alias = makeAlias({ isActive: false });
      const enabled = enableAlias(alias);
      expect(enabled.isActive).toBe(true);
    });
  });

  describe("isAliasActive", () => {
    it("returns true for active alias", () => {
      expect(isAliasActive(makeAlias())).toBe(true);
    });

    it("returns false for disabled alias", () => {
      expect(isAliasActive(makeAlias({ isActive: false }))).toBe(false);
    });
  });

  describe("recordAliasReceived", () => {
    it("increments received count", () => {
      const alias = makeAlias();
      const updated = recordAliasReceived(alias);
      expect(updated.stats.received).toBe(1);
      expect(updated.stats.lastActivity).toBeDefined();
    });
  });

  describe("recordAliasForwarded", () => {
    it("increments forwarded count", () => {
      const alias = makeAlias();
      const updated = recordAliasForwarded(alias);
      expect(updated.stats.forwarded).toBe(1);
    });
  });

  describe("getActiveAliases", () => {
    it("returns only active aliases", () => {
      const aliases = [
        makeAlias({ id: "a1", isActive: true }),
        makeAlias({ id: "a2", isActive: false }),
        makeAlias({ id: "a3", isActive: true }),
      ];
      const active = getActiveAliases(aliases);
      expect(active).toHaveLength(2);
    });
  });

  describe("getDisabledAliases", () => {
    it("returns only disabled aliases", () => {
      const aliases = [
        makeAlias({ id: "a1", isActive: true }),
        makeAlias({ id: "a2", isActive: false }),
      ];
      const disabled = getDisabledAliases(aliases);
      expect(disabled).toHaveLength(1);
    });
  });

  describe("findAliasByEmail", () => {
    it("finds alias by email", () => {
      const aliases = [makeAlias({ alias: "test@misfits.ai" })];
      const found = findAliasByEmail(aliases, "test@misfits.ai");
      expect(found).toBeDefined();
    });

    it("returns undefined for unknown email", () => {
      const aliases = [makeAlias()];
      const found = findAliasByEmail(aliases, "unknown@misfits.ai");
      expect(found).toBeUndefined();
    });
  });

  describe("computeAliasStats", () => {
    it("computes correct stats", () => {
      const aliases = [
        makeAlias({ id: "a1", isActive: true, stats: { received: 5, forwarded: 3, lastActivity: null } }),
        makeAlias({ id: "a2", isActive: false, stats: { received: 2, forwarded: 1, lastActivity: null } }),
      ];
      const stats = computeAliasStats(aliases);
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.disabled).toBe(1);
      expect(stats.totalReceived).toBe(7);
      expect(stats.totalForwarded).toBe(4);
    });
  });

  describe("canCreateAlias", () => {
    it("returns true when under limit", () => {
      expect(canCreateAlias(5, "free")).toBe(true);
    });

    it("returns false at limit", () => {
      expect(canCreateAlias(10, "free")).toBe(false);
    });
  });

  describe("getRemainingAliases", () => {
    it("returns correct remaining count", () => {
      expect(getRemainingAliases(5, "free")).toBe(5);
      expect(getRemainingAliases(10, "free")).toBe(0);
    });
  });

  describe("isValidAliasFormat", () => {
    it("validates correct format", () => {
      expect(isValidAliasFormat("abc123@misfits.ai")).toBe(true);
    });

    it("rejects invalid format", () => {
      expect(isValidAliasFormat("test@example.com")).toBe(false);
      expect(isValidAliasFormat("abc@misfits.ai")).toBe(false);
    });
  });

  describe("getAliasDomain", () => {
    it("returns misfits.ai", () => {
      expect(getAliasDomain()).toBe("misfits.ai");
    });
  });
});
