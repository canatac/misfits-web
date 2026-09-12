import { describe, expect, it } from "vitest";
import { isAllowedOrigin, getAllowedOrigins } from "../cors";

describe("cors", () => {
  it("isAllowedOrigin returns true for misfits.ai", () => {
    expect(isAllowedOrigin("https://mail.misfits.ai")).toBe(true);
  });

  it("isAllowedOrigin returns true for localhost in dev", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("isAllowedOrigin returns false for unknown origins", () => {
    expect(isAllowedOrigin("https://evil.com")).toBe(false);
  });

  it("isAllowedOrigin returns false for null", () => {
    expect(isAllowedOrigin(null)).toBe(false);
  });

  it("getAllowedOrigins returns array of origins", () => {
    const origins = getAllowedOrigins();
    expect(Array.isArray(origins)).toBe(true);
    expect(origins.length).toBeGreaterThan(0);
  });
});
