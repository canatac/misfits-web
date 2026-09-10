/**
 * Unit tests for email status indicators.
 */
import { describe, it, expect } from "vitest";
import {
  getEmailStatus,
  hasReply,
  hasForward,
  getStatusTooltip,
  getStatusIcons,
  shouldShowIndicators,
  getStatusAriaLabel,
} from "@/lib/email-status-indicators";

describe("email-status-indicators", () => {
  describe("getEmailStatus", () => {
    it("returns none when no flags", () => {
      expect(getEmailStatus({ hasReply: false, hasForward: false })).toBe("none");
    });

    it("returns replied when has reply", () => {
      expect(getEmailStatus({ hasReply: true, hasForward: false })).toBe("replied");
    });

    it("returns forwarded when has forward", () => {
      expect(getEmailStatus({ hasReply: false, hasForward: true })).toBe("forwarded");
    });

    it("returns both when has both", () => {
      expect(getEmailStatus({ hasReply: true, hasForward: true })).toBe("both");
    });
  });

  describe("hasReply", () => {
    it("returns true for replied", () => {
      expect(hasReply("replied")).toBe(true);
    });

    it("returns true for both", () => {
      expect(hasReply("both")).toBe(true);
    });

    it("returns false for none", () => {
      expect(hasReply("none")).toBe(false);
    });
  });

  describe("hasForward", () => {
    it("returns true for forwarded", () => {
      expect(hasForward("forwarded")).toBe(true);
    });

    it("returns true for both", () => {
      expect(hasForward("both")).toBe(true);
    });

    it("returns false for none", () => {
      expect(hasForward("none")).toBe(false);
    });
  });

  describe("getStatusTooltip", () => {
    it("returns reply tooltip", () => {
      expect(getStatusTooltip("replied")).toBe("You replied");
    });

    it("returns forward tooltip", () => {
      expect(getStatusTooltip("forwarded")).toBe("You forwarded");
    });

    it("returns both tooltip", () => {
      expect(getStatusTooltip("both")).toBe("You replied and forwarded");
    });

    it("returns empty for none", () => {
      expect(getStatusTooltip("none")).toBe("");
    });
  });

  describe("getStatusIcons", () => {
    it("returns empty for none", () => {
      expect(getStatusIcons("none")).toEqual([]);
    });

    it("returns reply for replied", () => {
      expect(getStatusIcons("replied")).toEqual(["reply"]);
    });

    it("returns both for both", () => {
      expect(getStatusIcons("both")).toEqual(["reply", "forward"]);
    });
  });

  describe("shouldShowIndicators", () => {
    it("returns false for none", () => {
      expect(shouldShowIndicators("none")).toBe(false);
    });

    it("returns true for replied", () => {
      expect(shouldShowIndicators("replied")).toBe(true);
    });
  });

  describe("getStatusAriaLabel", () => {
    it("returns reply label", () => {
      expect(getStatusAriaLabel("replied")).toBe("You replied to this email");
    });

    it("returns empty for none", () => {
      expect(getStatusAriaLabel("none")).toBe("");
    });
  });
});
