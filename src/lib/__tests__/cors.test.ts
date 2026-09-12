import { describe, expect, it } from "vitest";
import { corsHeaders, isAllowedOrigin, getCorsConfig } from "../cors";

describe("cors", () => {
  it("returns CORS headers object", () => {
    const headers = corsHeaders();
    expect(headers).toHaveProperty("Access-Control-Allow-Origin");
    expect(headers).toHaveProperty("Access-Control-Allow-Methods");
    expect(headers).toHaveProperty("Access-Control-Allow-Headers");
  });

  it("isAllowedOrigin returns true for misfits.ai", () => {
    expect(isAllowedOrigin("https://mail.misfits.ai")).toBe(true);
  });

  it("isAllowedOrigin returns true for localhost in dev", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("isAllowedOrigin returns false for unknown origins", () => {
    expect(isAllowedOrigin("https://evil.com")).toBe(false);
  });

  it("getCorsConfig returns configuration object", () => {
    const config = getCorsConfig();
    expect(config).toHaveProperty("origin");
    expect(config).toHaveProperty("methods");
    expect(Array.isArray(config.methods)).toBe(true);
  });
});
