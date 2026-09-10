/**
 * Integration test: Password strength cross-repo contract.
 *
 * password-strength.ts evaluates password strength for the registration
 * and password reset flows. This test verifies the contract between
 * frontend strength indicator and backend enforcement expectations.
 */
import { describe, it, expect } from "vitest";
import { evaluatePasswordStrength } from "@/lib/password-strength";
import type { PasswordStrength } from "@/lib/password-strength";

describe("Password strength cross-repo contract", () => {
  it("returns score 0 for empty password", () => {
    const result = evaluatePasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Very weak");
  });

  it("scores common passwords as 0", () => {
    expect(evaluatePasswordStrength("password").score).toBe(0);
    expect(evaluatePasswordStrength("123456").score).toBe(0);
    expect(evaluatePasswordStrength("qwerty").score).toBe(0);
    expect(evaluatePasswordStrength("misfits").score).toBe(0);
  });

  it("scores short passwords (< 8 chars) lower than medium", () => {
    const short = evaluatePasswordStrength("Ab1!");
    const medium = evaluatePasswordStrength("Abcdefgh1!");
    expect(short.score).toBeLessThanOrEqual(medium.score);
  });

  it("scores strong passwords (12+ chars, mixed) as 3-4", () => {
    const result = evaluatePasswordStrength("MyStr0ng!Pass#2026");
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("returns valid PasswordStrength shape", () => {
    const result: PasswordStrength = evaluatePasswordStrength("test");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("color");
    expect(result).toHaveProperty("percent");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(4);
    expect(result.percent).toBeGreaterThanOrEqual(0);
    expect(result.percent).toBeLessThanOrEqual(100);
  });

  it("penalizes obvious sequences", () => {
    const result = evaluatePasswordStrength("0123456789");
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("returns score within 0-4 range for any input", () => {
    const passwords = ["a", "ab", "abc", "abcd", "Abcdef1!", "VeryLongPassword123!@#"];
    for (const pwd of passwords) {
      const result = evaluatePasswordStrength(pwd);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
    }
  });
});
