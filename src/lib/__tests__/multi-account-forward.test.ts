/**
 * Unit tests for multi-account forwarding.
 */
import { describe, it, expect } from "vitest";
import {
  createForwardOptions,
  validateForwardOptions,
  getForwardableAccounts,
  getActiveAccountId,
  hasMultipleAccounts,
  formatAccountLabel,
  createForwardResult,
} from "@/lib/multi-account-forward";

describe("multi-account-forward", () => {
  describe("createForwardOptions", () => {
    it("creates options with defaults", () => {
      const options = createForwardOptions("to@example.com", "acc-1");
      expect(options.to).toBe("to@example.com");
      expect(options.fromAccountId).toBe("acc-1");
      expect(options.asAttachment).toBe(false);
    });
  });

  describe("validateForwardOptions", () => {
    it("validates correct options", () => {
      const result = validateForwardOptions(createForwardOptions("to@example.com", "acc-1"));
      expect(result.valid).toBe(true);
    });

    it("rejects empty recipient", () => {
      const result = validateForwardOptions(createForwardOptions("", "acc-1"));
      expect(result.valid).toBe(false);
    });
  });

  describe("getForwardableAccounts", () => {
    it("returns accounts without isActive", () => {
      const accounts = [
        { id: "a1", email: "a@example.com", color: "#ff0000", isActive: true },
        { id: "a2", email: "b@example.com", color: "#00ff00", isActive: false },
      ];
      const result = getForwardableAccounts(accounts);
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("isActive");
    });
  });

  describe("getActiveAccountId", () => {
    it("returns active account ID", () => {
      const accounts = [
        { id: "a1", isActive: false },
        { id: "a2", isActive: true },
      ];
      expect(getActiveAccountId(accounts)).toBe("a2");
    });
  });

  describe("hasMultipleAccounts", () => {
    it("returns true for multiple accounts", () => {
      expect(hasMultipleAccounts([{ id: "a1" }, { id: "a2" }])).toBe(true);
    });

    it("returns false for single account", () => {
      expect(hasMultipleAccounts([{ id: "a1" }])).toBe(false);
    });
  });

  describe("formatAccountLabel", () => {
    it("formats with name", () => {
      expect(formatAccountLabel({ email: "test@example.com", name: "Test" })).toBe("Test <test@example.com>");
    });

    it("formats without name", () => {
      expect(formatAccountLabel({ email: "test@example.com" })).toBe("test@example.com");
    });
  });

  describe("createForwardResult", () => {
    it("creates result", () => {
      const result = createForwardResult(createForwardOptions("to@example.com", "acc-1"));
      expect(result.success).toBe(true);
      expect(result.forwardId).toBeDefined();
    });
  });
});
