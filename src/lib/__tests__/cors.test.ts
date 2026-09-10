import { describe, expect, it } from "vitest";
import { isAllowedOrigin, getAllowedOrigins } from "@/lib/cors";

describe("CORS origin validation", () => {
  describe("isAllowedOrigin", () => {
    it("returns true for allowed production origins", () => {
      expect(isAllowedOrigin("https://mail.misfits.ai")).toBe(true);
      expect(isAllowedOrigin("https://www.mail.misfits.ai")).toBe(true);
    });

    it("returns false for arbitrary origins", () => {
      expect(isAllowedOrigin("https://evil.com")).toBe(false);
      expect(isAllowedOrigin("https://attacker.misfits.ai")).toBe(false);
      expect(isAllowedOrigin("http://localhost:3000")).toBe(false);
      expect(isAllowedOrigin("https://mail.misfits.ai.evil.com")).toBe(false);
      expect(isAllowedOrigin("")).toBe(false);
    });

    it("returns false for null origin", () => {
      expect(isAllowedOrigin(null)).toBe(false);
    });

    it("returns false for origins with trailing slash or query", () => {
      expect(isAllowedOrigin("https://mail.misfits.ai/")).toBe(false);
      expect(isAllowedOrigin("https://mail.misfits.ai?evil")).toBe(false);
    });
  });

  describe("getAllowedOrigins", () => {
    it("returns array of allowed origins", () => {
      const origins = getAllowedOrigins();
      expect(origins).toContain("https://mail.misfits.ai");
      expect(origins).toContain("https://www.mail.misfits.ai");
      expect(Array.isArray(origins)).toBe(true);
    });
  });
});
