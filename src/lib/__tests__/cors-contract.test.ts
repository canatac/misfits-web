/**
 * Integration test: CORS configuration cross-repo contract.
 *
 * cors.ts defines allowed origins for the middleware.
 * This test verifies the contract between frontend CORS gate and
 * Caddy reverse proxy configuration.
 */
import { describe, it, expect } from "vitest";
import { isAllowedOrigin, getAllowedOrigins } from "@/lib/cors";

describe("CORS cross-repo contract", () => {
  it("allows https://mail.misfits.ai", () => {
    expect(isAllowedOrigin("https://mail.misfits.ai")).toBe(true);
  });

  it("allows https://www.mail.misfits.ai", () => {
    expect(isAllowedOrigin("https://www.mail.misfits.ai")).toBe(true);
  });

  it("rejects unknown origins", () => {
    expect(isAllowedOrigin("https://evil.com")).toBe(false);
    expect(isAllowedOrigin("https://misfits.ai")).toBe(false);
    expect(isAllowedOrigin("http://mail.misfits.ai")).toBe(false);
  });

  it("rejects null/empty origin", () => {
    expect(isAllowedOrigin(null)).toBe(false);
    expect(isAllowedOrigin("")).toBe(false);
  });

  it("getAllowedOrigins returns array including production", () => {
    const origins = getAllowedOrigins();
    expect(origins).toContain("https://mail.misfits.ai");
    expect(origins).toContain("https://www.mail.misfits.ai");
  });

  it("includes localhost in non-production mode", () => {
    const origins = getAllowedOrigins();
    // In test env (NODE_ENV !== production), localhost should be allowed
    expect(origins.some((o) => o.includes("localhost"))).toBe(true);
  });

  it("origins are valid URLs", () => {
    const origins = getAllowedOrigins();
    for (const origin of origins) {
      expect(() => new URL(origin)).not.toThrow();
    }
  });
});
