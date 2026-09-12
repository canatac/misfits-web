import { describe, expect, it } from "vitest";
import { evaluatePasswordStrength } from "../password-strength";

describe("evaluatePasswordStrength", () => {
  it("returns score 0 for empty password", () => {
    const result = evaluatePasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Very weak");
    expect(result.percent).toBe(10);
  });

  it("scores very short passwords low", () => {
    const result = evaluatePasswordStrength("a");
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("scores common passwords as Very weak", () => {
    const result = evaluatePasswordStrength("password");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Very weak");
  });

  it("scores sequential passwords low", () => {
    const result = evaluatePasswordStrength("12345678");
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("rewards mixed case + digits + symbols", () => {
    const result = evaluatePasswordStrength("MyP@ssw0rd!2024");
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("scores 4 for long complex passwords", () => {
    const result = evaluatePasswordStrength("Tr0ub4dor&3xY!9zL#p");
    expect(result.score).toBe(4);
    expect(result.label).toBe("Strong");
    expect(result.percent).toBe(100);
  });

  it("rewards length 16+ with variety", () => {
    const result = evaluatePasswordStrength("CorrectHorseBatteryStaple!");
    expect(result.score).toBeGreaterThanOrEqual(4);
  });

  it("returns valid color tokens", () => {
    const result = evaluatePasswordStrength("test");
    expect(result.color).toMatch(/var\(--color-/);
  });
});
